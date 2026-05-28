"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { fetchProductLot, explorerUrl } from "@/src/lib/trace";
import type { ProductLot, TraceStage } from "@/src/lib/trace";

// ───────── Helpers ─────────

function getDetail(traces: TraceStage[], stage: number, key: string): string {
  const t = traces.find((x) => x.stage === stage);
  const v = t?.details?.[key];
  return typeof v === "string" || typeof v === "number" ? String(v) : "—";
}

function fmtDate(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("vi-VN");
}

const STAGE_META = [
  { num: 1, title: "NGUỒN GỐC", en: "SUPPLIER", color: "bg-blue-600", icon: "fa-ship" },
  { num: 3, title: "CHẾ BIẾN", en: "MANUFACTURING", color: "bg-green-600", icon: "fa-industry" },
  { num: 4, title: "LƯU KHO", en: "WAREHOUSE", color: "bg-orange-500", icon: "fa-warehouse" },
  { num: 5, title: "VẬN CHUYỂN", en: "SHIPPING", color: "bg-purple-600", icon: "fa-truck-fast" },
];

export default function TraceDetailClient() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    document.title = `TORO Trace — ${id}`;
    loadProduct();
    if (typeof window !== "undefined") {
      QRCode.toDataURL(window.location.href, { width: 164, margin: 2, color: { dark: "#0f2a5f", light: "#ffffff" } })
        .then(setQrUrl)
        .catch(() => setQrUrl(""));
    }
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    try {
      const lot = await fetchProductLot(id);
      setProduct(lot);
    } catch (e) {
      console.error("Failed to load product:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-white mb-2">Không tìm thấy sản phẩm</h1>
        <p className="text-white/60 text-sm">Mã lô &quot;{id}&quot; không tồn tại.</p>
      </div>
    );
  }

  const batch = product.batches[0];
  const batchTrace = batch?.trace || [];
  const lotTrace = product.lotTraces || [];

  const kpi = [
    { icon: "fa-regular fa-calendar", title: "Ngày xuất bến", value: fmtDate(product.packagingDate) },
    { icon: "fa-solid fa-fish", title: "Loại sản phẩm", value: "Cá ngừ đóng hộp" },
    { icon: "fa-solid fa-water", title: "Giống cá", value: getDetail(batchTrace, 1, "Fish Species") },
    { icon: "fa-solid fa-location-dot", title: "Khu vực", value: getDetail(batchTrace, 1, "Country") },
  ];

  const certs = [
    { key: "HACCP Certified", label: "HACCP", icon: "fa-circle-check" },
    { key: "FDA Approved", label: "FDA", icon: "fa-shield" },
    { key: "Lab Test Passed", label: "LAB TEST", icon: "fa-vial-circle-check" },
  ].filter((c) => (batchTrace[0]?.details?.[c.key] as string)?.includes("✓"));

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-4 py-4 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/trace" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <i className="fa-solid fa-arrow-left" />
            Quay lại
          </a>
          <span className="text-white/40 text-xs">{id}</span>
        </div>
      </div>

      {/* ── Light Content Area ── */}
      <div className="bg-[#e9eef5] min-h-[calc(100vh-64px)]">
        <div className="max-w-lg sm:max-w-2xl mx-auto pb-8">

          {/* Hero */}
          <section className="relative bg-gradient-to-b from-[#001f5c] via-[#01296f] to-[#01337e] pt-8 pb-28 px-6 text-center overflow-hidden rounded-b-[32px]">
            <div className="absolute w-80 h-80 rounded-full bg-white/[0.04] -top-44 -right-28" />
            <div className="absolute w-60 h-60 rounded-full bg-white/[0.03] -bottom-36 -left-28" />
            <div className="relative z-10">
              <img src="/Logo_darkbg.png" alt="TORO" className="w-16 h-auto mx-auto mb-4 opacity-90" />
              <p className="text-[#c7d2fe] text-[11px] tracking-[2px] font-medium mb-2">NGUỒN GỐC TRUY XUẤT</p>
              <h1 className="text-white text-lg sm:text-xl font-extrabold leading-relaxed">
                CÁ NGỪ XUẤT KHẨU<br />CỦA VIỆT NAM
              </h1>
            </div>
          </section>

          {/* Floating Card */}
          <div className="relative z-20 mx-4 -mt-20 bg-white rounded-[28px] p-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4 text-green-600 text-xs font-bold">
              <div className="w-[22px] h-[22px] rounded-full bg-green-100 flex items-center justify-center text-[11px]">
                <i className="fa-solid fa-check" />
              </div>
              Sản phẩm được xác thực bởi Blockchain
            </div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-[11px] font-bold tracking-wide mb-2">MÃ TRUY XUẤT</p>
                <p className="text-[#0f172a] text-xl font-extrabold leading-tight mb-4 break-words">
                  {id}
                </p>
                {qrUrl && (
                  <>
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={qrUrl} alt="QR" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-slate-500 text-[10px] font-semibold mt-1.5">Quét mã QR</p>
                  </>
                )}
              </div>
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[22px] overflow-hidden shadow-lg border-4 border-white flex-shrink-0">
                <img src="/tuna_on_can.png" alt="Tuna" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-2.5 px-4 mt-5 mb-7">
            {kpi.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 min-h-[110px] text-center shadow-sm flex flex-col justify-center">
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[15px]">
                  <i className={item.icon} />
                </div>
                <p className="text-slate-400 text-[9px] leading-relaxed mb-1">{item.title}</p>
                <p className="text-[#0f172a] text-[11px] leading-relaxed font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Section Title */}
          <div className="px-4 mb-5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2a5f]">HÀNH TRÌNH TRUY XUẤT</h2>
            {product.batches.length > 1 && (
              <p className="text-slate-500 text-xs mt-1">
                {product.batches.length} lô nguyên liệu: {product.batches.map(b => b.batchId).join(", ")}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="relative pl-14 pr-4 pb-4">
            <div className="absolute left-[34px] top-0 bottom-0 w-0.5 bg-[#d7dee8]" />

            {STAGE_META.map((stage, idx) => {
              const trace = stage.num === 1
                ? batchTrace.find(t => t.stage === 1)
                : lotTrace.find(t => t.stage === stage.num);

              return (
                <div key={idx} className="relative mb-5">
                  <div className={`absolute left-[-46px] top-4 w-10 h-10 rounded-full ${stage.color} flex items-center justify-center text-white text-base border-4 border-[#e9eef5] shadow-md z-10`}>
                    <i className={`fa-solid ${stage.icon}`} />
                  </div>
                  <div className="bg-white rounded-3xl p-5 shadow-sm">
                    <h3 className="text-[15px] font-extrabold text-[#0f2a5f] mb-4">
                      {idx + 1}. {stage.title} <span className="text-slate-500">({stage.en})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3.5">
                      {stage.num === 1 && (
                        <>
                          <Detail label="Tàu khai thác" value={getDetail(batchTrace, 1, "Vessel/Farm ID")} />
                          <Detail label="Loại tàu" value={getDetail(batchTrace, 1, "Source Type")} />
                          <Detail label="Ngày đánh bắt" value={getDetail(batchTrace, 1, "Catch Date")} />
                          <Detail label="Phương pháp" value={getDetail(batchTrace, 1, "Fishing Method")} />
                          <Detail label="Vùng biển" value={getDetail(batchTrace, 1, "Catch Area")} />
                          <Detail label="Khối lượng" value={getDetail(batchTrace, 1, "Catch Weight (kg)") + " kg"} />
                        </>
                      )}
                      {stage.num === 3 && (
                        <>
                          <Detail label="Nhà máy" value={getDetail(lotTrace, 3, "Factory Name")} />
                          <Detail label="Mã lô" value={batch?.batchId || "—"} />
                          <Detail label="Ngày SX" value={getDetail(lotTrace, 3, "Production Date")} />
                          <Detail label="Ngày đóng gói" value={getDetail(lotTrace, 3, "Packaging Date")} />
                          <Detail label="Đầu vào" value={getDetail(lotTrace, 3, "Input Weight (kg)") + " kg"} />
                          <Detail label="Số lon" value={getDetail(lotTrace, 3, "Output Cans")} />
                        </>
                      )}
                      {stage.num === 4 && (
                        <>
                          <Detail label="Kho lạnh" value={getDetail(lotTrace, 4, "Warehouse Name")} />
                          <Detail label="Ngày nhập" value={getDetail(lotTrace, 4, "Storage Date")} />
                          <Detail label="Nhiệt độ" value={getDetail(lotTrace, 4, "Storage Temp (°C)")} />
                          <Detail label="Thời gian" value={getDetail(lotTrace, 4, "Storage Duration (hrs)") + " giờ"} />
                        </>
                      )}
                      {stage.num === 5 && (
                        <>
                          <Detail label="Từ" value={getDetail(lotTrace, 5, "From Country") || "Singapore"} />
                          <Detail label="Đến" value={getDetail(lotTrace, 5, "To Country") || "Nhật Bản"} />
                          <Detail label="Khởi hành" value={getDetail(lotTrace, 5, "Departure Date")} />
                          <Detail label="Đến nơi" value={getDetail(lotTrace, 5, "Arrival Date")} />
                          <Detail label="Thời gian" value={getDetail(lotTrace, 5, "Transit Duration (hrs)") + " giờ"} />
                          <Detail label="Nhiệt độ" value={getDetail(lotTrace, 5, "Transit Temp (°C)")} />
                        </>
                      )}
                    </div>

                    {stage.num === 3 && certs.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <p className="text-center text-xs font-extrabold text-[#0f2a5f] mb-4">CHỨNG NHẬN & KIỂM NGHIỆM</p>
                        <div className="grid grid-cols-3 gap-2.5">
                          {certs.map(c => (
                            <div key={c.key} className="bg-slate-50 rounded-xl py-3 px-2 text-center">
                              <i className={`fa-solid ${c.icon} text-green-600 text-[15px] mb-2`} />
                              <div className="text-green-600 text-[11px] font-bold">{c.label}</div>
                              <small className="block mt-1 text-slate-400 text-[9px]">CERTIFIED</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {trace?.txHash && (
                      <a href={explorerUrl(trace.txHash)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 text-[11px] text-blue-600 font-semibold hover:underline">
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                        Xem giao dịch
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Distribution */}
            <div className="relative mb-5">
              <div className="absolute left-[-46px] top-4 w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white text-base border-4 border-[#e9eef5] shadow-md z-10">
                <i className="fa-solid fa-store" />
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm">
                <h3 className="text-[15px] font-extrabold text-[#0f2a5f] mb-4">
                  5. PHÂN PHỐI <span className="text-slate-500">(DISTRIBUTOR)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3.5">
                  <Detail label="Nhà phân phối" value={getDetail(lotTrace, 5, "To Country") || "Tokyo Distributor"} />
                  <Detail label="Tình trạng" value="Đã nhận hàng" />
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain */}
          <div className="mx-4 mb-6 bg-white rounded-3xl p-4 flex items-center justify-between shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div className="flex-1 ml-3.5">
              <h4 className="text-[#0f2a5f] text-[15px] font-bold mb-1">XÁC THỰC BLOCKCHAIN</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">Dữ liệu được ghi nhận trên blockchain và xác minh toàn chuỗi cung ứng</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-[11px] font-bold flex-shrink-0 ml-2">
              ✓ Verified
            </div>
          </div>

          {/* Footer text */}
          <div className="text-center pb-6">
            <p className="text-[#001b4f] text-xs font-semibold tracking-wide">TORO — TRUSTLESS OCEANIC RECORD OF ORIGIN</p>
            <p className="text-blue-800/60 text-[10px] mt-1">Minh bạch • Chính xác • Bền vững</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-[11px] mb-1 font-semibold">{label}</p>
      <p className="text-[#0f172a] text-xs leading-relaxed font-bold">{value}</p>
    </div>
  );
}
