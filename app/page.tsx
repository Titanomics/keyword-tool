"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface KeywordResult {
  relKeyword: string;
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
  compIdx: string;
}

type SortKey = "pc" | "mobile" | "total" | null;

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  return 0;
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [filterByKeyword, setFilterByKeyword] = useState(true);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "검색에 실패했습니다.");
        return;
      }

      if (data.keywordList) {
        setResults(data.keywordList);
      } else {
        setError("검색 결과가 없습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const formatNumber = (value: number | string) => {
    if (value === "< 10") return "< 10";
    if (typeof value === "number") return value.toLocaleString();
    return value;
  };

  const formatCompIdx = (value: string) => {
    if (value === "높음") return "높음";
    if (value === "중간") return "중간";
    if (value === "낮음") return "낮음";
    return value;
  };

  const handleSort = (key: SortKey) => {
    setSortKey((prev) => (prev === key ? null : key));
  };

  const filteredResults = (() => {
    if (!filterByKeyword || !keyword.trim()) return results;
    const kw = keyword.trim().toLowerCase();
    return results.filter((item) => item.relKeyword.toLowerCase().includes(kw));
  })();

  const sortedResults = (() => {
    if (!sortKey) return filteredResults;
    return [...filteredResults].sort((a, b) => {
      if (sortKey === "pc") return toNumber(b.monthlyPcQcCnt) - toNumber(a.monthlyPcQcCnt);
      if (sortKey === "mobile") return toNumber(b.monthlyMobileQcCnt) - toNumber(a.monthlyMobileQcCnt);
      return (toNumber(b.monthlyPcQcCnt) + toNumber(b.monthlyMobileQcCnt)) - (toNumber(a.monthlyPcQcCnt) + toNumber(a.monthlyMobileQcCnt));
    });
  })();

  const getCompIdxColor = (value: string) => {
    if (value === "높음") return "text-red-500 font-semibold";
    if (value === "중간") return "text-yellow-500 font-semibold";
    if (value === "낮음") return "text-green-500 font-semibold";
    return "";
  };

  const exportToExcel = () => {
    if (results.length === 0) return;

    const excelData = sortedResults.map((item, index) => ({
      "No.": index + 1,
      키워드: item.relKeyword,
      "월간 PC 검색량": item.monthlyPcQcCnt,
      "월간 모바일 검색량": item.monthlyMobileQcCnt,
      "총 검색량": toNumber(item.monthlyPcQcCnt) + toNumber(item.monthlyMobileQcCnt),
      경쟁강도: formatCompIdx(item.compIdx),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 14 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "검색량");
    XLSX.writeFile(
      wb,
      `네이버_검색량_${keyword}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          기린컴퍼니 전용 네이버 검색량 조회
        </h1>
        <p className="text-center text-gray-500 mb-8">
          키워드를 입력하면 연관 키워드의 월간 검색량과 경쟁강도를 조회합니다
        </p>

        {/* 검색 영역 */}
        <div className="flex gap-3 mb-8 max-w-xl mx-auto">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색할 키워드를 입력하세요"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            {error}
          </div>
        )}

        {/* 결과 영역 */}
        {results.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  총 <strong>{sortedResults.length}</strong>개 키워드
                  {filterByKeyword && sortedResults.length !== results.length && (
                    <span className="text-gray-400 ml-1">
                      (전체 {results.length}개)
                    </span>
                  )}
                </span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterByKeyword}
                    onChange={(e) => setFilterByKeyword(e.target.checked)}
                    className="w-4 h-4 accent-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">키워드 포함만</span>
                </label>
              </div>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                엑셀 다운로드
              </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-16">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      키워드
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer select-none hover:text-green-600 transition-colors"
                      onClick={() => handleSort("pc")}
                    >
                      월간 PC 검색량 {sortKey === "pc" ? "▼" : "↕"}
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer select-none hover:text-green-600 transition-colors"
                      onClick={() => handleSort("mobile")}
                    >
                      월간 모바일 검색량 {sortKey === "mobile" ? "▼" : "↕"}
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer select-none hover:text-green-600 transition-colors"
                      onClick={() => handleSort("total")}
                    >
                      총 검색량 {sortKey === "total" ? "▼" : "↕"}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                      경쟁강도
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {item.relKeyword}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {formatNumber(item.monthlyPcQcCnt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {formatNumber(item.monthlyMobileQcCnt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                        {(toNumber(item.monthlyPcQcCnt) + toNumber(item.monthlyMobileQcCnt)).toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-center ${getCompIdxColor(item.compIdx)}`}
                      >
                        {formatCompIdx(item.compIdx)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">검색 중입니다...</p>
          </div>
        )}
      </div>
    </div>
  );
}
