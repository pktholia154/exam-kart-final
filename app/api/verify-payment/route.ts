import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment verification parameters." },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "9a5bbmZLhY27bp41KKKVxJNC";
    if (!keySecret) {
      console.error("Razorpay key secret is missing from environment variables.");
      return NextResponse.json(
        { error: "Razorpay secret key is not configured on server." },
        { status: 500 }
      );
    }

    // HMAC-SHA256 signature verification
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (expectedSignature.length !== razorpay_signature.length) {
      return NextResponse.json(
        { error: "Signature length mismatch. Payment verification failed." },
        { status: 400 }
      );
    }

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(razorpay_signature, "utf-8")
    );

    if (!isAuthentic) {
      return NextResponse.json(
        { error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment signature" },
      { status: 500 }
    );
  }
}
