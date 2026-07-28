import { GET as proxyGET } from "../proxy-pdf/route";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return proxyGET(req);
}

