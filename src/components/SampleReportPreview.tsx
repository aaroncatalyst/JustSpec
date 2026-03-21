// Static sample data — not fetched from anywhere
const SAMPLE_QUANTITIES = [1000, 5000, 10000]
const PIVOT_QTY = 5000

const SAMPLE_SUPPLIERS = [
  {
    name: 'Shenzhen Longhua Manufacturing Co.',
    fob: [3.2, 2.65, 2.38],
    moq: 500,
    leadTime: '35 days',
    paymentTerms: '30% TT, 70% BL',
    tooling: null,
    existingMold: true,
    fda: true,
  },
  {
    name: 'Guangzhou Topwell Industrial Ltd.',
    fob: [3.45, 2.8, 2.52],
    moq: 1000,
    leadTime: '28 days',
    paymentTerms: '50% TT, 50% BL',
    tooling: 1200,
    existingMold: false,
    fda: true,
  },
  {
    name: 'Yiwu Shengtai Import & Export',
    fob: [3.68, 3.02, 2.71],
    moq: 2000,
    leadTime: '42 days',
    paymentTerms: '100% TT advance',
    tooling: 800,
    existingMold: false,
    fda: false,
  },
  {
    name: 'Dongguan Haoli Hardware Co.',
    fob: [3.92, 3.18, 2.85],
    moq: 1000,
    leadTime: '38 days',
    paymentTerms: '30% TT, 70% LC',
    tooling: 1800,
    existingMold: false,
    fda: true,
  },
  {
    name: 'Ningbo Zhongyi Precision Parts',
    fob: [4.15, 3.42, 3.08],
    moq: 500,
    leadTime: '45 days',
    paymentTerms: '30% TT, 70% BL',
    tooling: null,
    existingMold: true,
    fda: false,
  },
]

function calcLanded(fob: number, qty: number): number {
  return fob + 0.15 + fob * 0.053 + 1900 / qty
}

interface SampleReportPreviewProps {
  /** When true, wraps in a collapsible <details> with a preview banner */
  collapsible?: boolean
}

export default function SampleReportPreview({ collapsible = false }: SampleReportPreviewProps) {
  const table = (
    <div className="opacity-80">
      {/* Preview banner */}
      <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
        <p className="text-xs font-medium text-amber-700">
          Preview — this is a sample report. Your real quotes will replace this within 24–48 hours.
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[#e8e8e2]">
              <th className="text-left text-xs font-semibold text-[#8a8a82] pb-3 pr-4 whitespace-nowrap">Supplier</th>
              {SAMPLE_QUANTITIES.map((qty) => (
                <th key={qty} className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">
                  FOB @ {qty.toLocaleString()}
                </th>
              ))}
              <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">
                Landed @ {PIVOT_QTY.toLocaleString()}
              </th>
              <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">MOQ</th>
              <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Lead Time</th>
              <th className="text-left text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Payment Terms</th>
              <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Tooling</th>
              <th className="text-center text-xs font-semibold text-[#8a8a82] pb-3 pl-3 whitespace-nowrap">FDA</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_SUPPLIERS.map((supplier, i) => {
              const pivotFob = supplier.fob[1] // index 1 = 5,000 qty
              const landed = calcLanded(pivotFob, PIVOT_QTY)
              const isWinner = i === 0
              return (
                <tr
                  key={supplier.name}
                  className={`border-b border-[#f0f0ec] last:border-0 ${isWinner ? 'bg-[#eaf3ef]/40' : ''}`}
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <span className="bg-[#1a6b4a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Best
                        </span>
                      )}
                      <span className={`font-medium ${isWinner ? 'text-[#1a6b4a]' : 'text-[#1a1a18]'}`}>
                        {supplier.name}
                      </span>
                    </div>
                  </td>
                  {supplier.fob.map((price, qi) => (
                    <td key={qi} className="py-4 px-3 text-right font-mono text-[#1a1a18] tabular-nums">
                      ${price.toFixed(4)}
                    </td>
                  ))}
                  <td className="py-4 px-3 text-right font-mono font-semibold text-[#1a1a18] tabular-nums">
                    ${landed.toFixed(4)}
                  </td>
                  <td className="py-4 px-3 text-right text-[#1a1a18]">
                    {supplier.moq.toLocaleString()}
                  </td>
                  <td className="py-4 px-3 text-right text-[#1a1a18]">
                    {supplier.leadTime}
                  </td>
                  <td className="py-4 px-3 text-left text-[#1a1a18]">
                    <span className="block max-w-[160px] truncate" title={supplier.paymentTerms}>
                      {supplier.paymentTerms}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right text-[#1a1a18]">
                    {supplier.existingMold
                      ? <span className="text-[#1a6b4a]">None</span>
                      : supplier.tooling
                      ? `$${supplier.tooling.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="py-4 pl-3 text-center">
                    {supplier.fda
                      ? <span className="text-[#1a6b4a] font-semibold">Yes</span>
                      : <span className="text-red-500 font-semibold">No</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#8a8a82] mt-4 pt-4 border-t border-[#f0f0ec]">
        Landed cost = FOB + $0.15/unit ocean freight + 5.3% import duty + $1,900 fixed costs (bond + customs entry + drayage + inspection) ÷ quantity
      </p>
    </div>
  )

  if (!collapsible) return table

  return (
    <details open className="bg-white border border-[#e8e8e2] rounded-2xl overflow-hidden">
      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer select-none list-none group">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a18]">What your report will look like</h3>
          <p className="text-xs text-[#8a8a82] mt-0.5">Sample comparison table with 5 suppliers · click to collapse</p>
        </div>
        <svg
          className="w-4 h-4 text-[#8a8a82] transition-transform details-chevron"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </summary>
      <div className="px-6 pb-6 border-t border-[#f0f0ec] pt-5">
        {table}
      </div>
    </details>
  )
}
