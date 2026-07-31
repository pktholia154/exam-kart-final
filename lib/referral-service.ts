import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  increment 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { User } from "firebase/auth";

export interface UserProfile {
  id: string;
  referral_code: string;
  referred_by_user_id?: string | null;
  referred_by_code?: string | null;
  wallet_balance: number;
  displayName?: string | null;
  email?: string | null;
  created_at: string;
}

export interface ReferralRecord {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  order_id?: string;
  status: "clicked" | "signed_up" | "pending" | "rewarded" | "rejected";
  reward_amount?: number;
  purchase_amount?: number;
  created_at: string;
  reward_available_at?: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "referral_credit" | "purchase_debit" | "reversal";
  description: string;
  referral_id?: string;
  created_at: string;
}

// 30-day attribution cookie helper
export function getReferralCodeCookie(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )referral_code=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  return localStorage.getItem("referral_code");
}

export function setReferralCodeCookie(code: string) {
  if (typeof window === "undefined") return;
  const cleanCode = code.toUpperCase().trim();
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `referral_code=${cleanCode}; path=/; max-age=${maxAge}`;
  localStorage.setItem("referral_code", cleanCode);
}

export function clearReferralCodeCookie() {
  if (typeof window === "undefined") return;
  document.cookie = "referral_code=; path=/; max-age=0";
  localStorage.removeItem("referral_code");
}

export function generateReferralCode(displayName?: string | null, uid?: string): string {
  const prefix = (displayName || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .substring(0, 6) || "EXAM";
  const suffix = uid ? uid.substring(0, 4).toUpperCase() : Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${suffix}`;
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      // Auto unlock any pending rewards older than 7 days
      checkAndUnlockPendingRewards(user.uid).catch((err) =>
        console.warn("Error auto unlocking rewards:", err)
      );
      return data;
    }

    // New user registration flow
    const cookieCode = getReferralCodeCookie();
    let referrerUserId: string | null = null;
    let referrerCode: string | null = null;

    if (cookieCode) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("referral_code", "==", cookieCode.toUpperCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const referrerDoc = querySnap.docs[0];
          if (referrerDoc.id !== user.uid) {
            referrerUserId = referrerDoc.id;
            referrerCode = cookieCode.toUpperCase();
          }
        }
      } catch (err) {
        console.warn("Could not match referral code:", err);
      }
    }

    const myReferralCode = generateReferralCode(user.displayName, user.uid);
    const newProfile: UserProfile = {
      id: user.uid,
      referral_code: myReferralCode,
      referred_by_user_id: referrerUserId,
      referred_by_code: referrerCode,
      wallet_balance: 0,
      displayName: user.displayName || "Student",
      email: user.email || "",
      created_at: new Date().toISOString(),
    };

    await setDoc(userRef, newProfile);

    // If referred, log signed_up referral record
    if (referrerUserId) {
      try {
        await addDoc(collection(db, "referrals"), {
          referrer_user_id: referrerUserId,
          referred_user_id: user.uid,
          status: "signed_up",
          created_at: new Date().toISOString(),
        });
      } catch (refErr) {
        handleFirestoreError(refErr, OperationType.WRITE, "referrals");
      }
    }

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    return {
      id: user.uid,
      referral_code: generateReferralCode(user.displayName, user.uid),
      wallet_balance: 0,
      displayName: user.displayName,
      email: user.email,
      created_at: new Date().toISOString(),
    };
  }
}

export async function checkAndUnlockPendingRewards(userId: string) {
  try {
    const refsCollection = collection(db, "referrals");
    const q = query(
      refsCollection,
      where("referrer_user_id", "==", userId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const now = new Date();
    for (const refDoc of snap.docs) {
      const data = refDoc.data() as ReferralRecord;
      if (data.reward_available_at && new Date(data.reward_available_at) <= now && data.reward_amount) {
        // Unlock credit!
        const refRef = doc(db, "referrals", refDoc.id);
        await updateDoc(refRef, { status: "rewarded" });

        // Update user balance
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          wallet_balance: increment(data.reward_amount),
        });

        // Write ledger transaction
        await addDoc(collection(db, "wallet_transactions"), {
          user_id: userId,
          amount: data.reward_amount,
          type: "referral_credit",
          description: `Referral credit unlocked from friend's order (${data.order_id || "Ebook order"})`,
          referral_id: refDoc.id,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn("Check and unlock pending rewards error:", err);
  }
}

export async function processReferralOrderReward(params: {
  buyerUserId: string;
  orderId: string;
  netPaidAmount: number; // in INR
}) {
  const { buyerUserId, orderId, netPaidAmount } = params;

  // Minimum purchase amount rule: ₹100
  if (netPaidAmount < 100) {
    console.log("Order below minimum purchase threshold (₹100) for referral reward.");
    return;
  }

  try {
    // 1. Get buyer profile to check if they were referred
    const buyerRef = doc(db, "users", buyerUserId);
    const buyerSnap = await getDoc(buyerRef);
    if (!buyerSnap.exists()) return;

    const buyerData = buyerSnap.data() as UserProfile;
    const referrerId = buyerData.referred_by_user_id;

    if (!referrerId || referrerId === buyerUserId) {
      return; // No referrer or self-referral
    }

    // 2. Check if this is the buyer's 1st completed order
    const purchasesQuery = query(
      collection(db, "purchases"),
      where("userId", "==", buyerUserId)
    );
    const purchasesSnap = await getDocs(purchasesQuery);
    // Since this purchase was just recorded, if length > 1 (or multiple items in same order), ensure it's their first order event
    // We check existing pending/rewarded referrals for this buyer
    const existingRefQuery = query(
      collection(db, "referrals"),
      where("referred_user_id", "==", buyerUserId),
      where("status", "in", ["pending", "rewarded"])
    );
    const existingRefSnap = await getDocs(existingRefQuery);
    if (!existingRefSnap.empty) {
      console.log("Referral reward already processed for this user's first order.");
      return;
    }

    // 3. Check referrer's monthly cap (max 5 referrals per month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyQuery = query(
      collection(db, "referrals"),
      where("referrer_user_id", "==", referrerId),
      where("created_at", ">=", startOfMonth)
    );
    const monthlySnap = await getDocs(monthlyQuery);
    const rewardedThisMonth = monthlySnap.docs.filter(
      (d) => ["pending", "rewarded"].includes(d.data().status)
    ).length;

    if (rewardedThisMonth >= 5) {
      console.log("Referrer has reached monthly cap of 5 rewarded referrals.");
      return;
    }

    // 4. Calculate 20% reward (capped at ₹300)
    const rewardAmount = Math.min(300, Math.round(netPaidAmount * 0.20));
    if (rewardAmount <= 0) return;

    // 5. Calculate validation period (7 days from now)
    const rewardAvailableAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 6. Record pending referral
    await addDoc(collection(db, "referrals"), {
      referrer_user_id: referrerId,
      referred_user_id: buyerUserId,
      order_id: orderId,
      status: "pending",
      reward_amount: rewardAmount,
      purchase_amount: netPaidAmount,
      created_at: new Date().toISOString(),
      reward_available_at: rewardAvailableAt,
    });

    console.log(`Successfully logged pending referral reward of ₹${rewardAmount} for referrer ${referrerId}`);
  } catch (err) {
    console.error("Failed to process referral order reward:", err);
  }
}

export async function deductWalletCredit(params: {
  userId: string;
  amountToDeduct: number;
  orderId: string;
}) {
  const { userId, amountToDeduct, orderId } = params;
  if (amountToDeduct <= 0) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      wallet_balance: increment(-amountToDeduct),
    });

    await addDoc(collection(db, "wallet_transactions"), {
      user_id: userId,
      amount: -amountToDeduct,
      type: "purchase_debit",
      description: `Store credit applied to Order ${orderId}`,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to deduct wallet credit:", err);
  }
}
