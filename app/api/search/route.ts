import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = "01000000007f44037ed2e006f9d93d3b02f5b292725e3fb8a386fae16aadcdfa53e4daba8a";
const SECRET_KEY = "AQAAAAB/RAN+0uAG+dk9OwL1spJydHGDurlOzGKvtgQtG47Y2w==";
const CUSTOMER_ID = "3523257";

function generateSignature(timestamp: number, method: string, uri: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(message);
  return hmac.digest("base64");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
  }

  const timestamp = Date.now();
  const method = "GET";
  const uri = "/keywordstool";
  const signature = generateSignature(timestamp, method, uri);

  const apiUrl = new URL("https://api.searchad.naver.com/keywordstool");
  apiUrl.searchParams.set("hintKeywords", keyword);
  apiUrl.searchParams.set("showDetail", "1");

  try {
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "X-Timestamp": String(timestamp),
        "X-API-KEY": API_KEY,
        "X-Customer": CUSTOMER_ID,
        "X-Signature": signature,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Naver API error:", response.status, errorText);
      return NextResponse.json(
        { error: `네이버 API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API request failed:", error);
    return NextResponse.json(
      { error: "API 요청에 실패했습니다." },
      { status: 500 }
    );
  }
}
