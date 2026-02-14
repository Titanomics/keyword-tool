import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = "W9ZMK8Wcy7GQa2bXoTwA";
const CLIENT_SECRET = "D6iDMkbtEn";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const body = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    timeUnit: "month",
    keywordGroups: [
      {
        groupName: keyword,
        keywords: [keyword],
      },
    ],
  };

  try {
    const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Naver DataLab API error:", response.status, errorText);
      return NextResponse.json(
        { error: `네이버 데이터랩 API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("DataLab API request failed:", error);
    return NextResponse.json(
      { error: "API 요청에 실패했습니다." },
      { status: 500 }
    );
  }
}
