export default function ScoreCard() {
    return (
        <div className="mt-2 flex gap-4">
            {/* First Box */}
            <div
                className="flex-1 h-[80px] rounded-[4px] p-3 flex flex-col justify-between"
                style={{
                    background: 'radial-gradient(circle, rgba(234, 246, 236, 0.5), rgba(111, 196, 130, 0.5))'
                }}
            >
                <div className="text-center">
                    <div className="text-[#0A468C] text-[24px] leading-[32px] font-bold">85</div>
                </div>

                <div className="text-center text-[12px] leading-[16px] font-medium tracking-[0.2%] text-[#212529]">
                    Your Score
                </div>
            </div>

            {/* Second Box */}
            <div
                className="flex-1 h-[80px] rounded-[4px] p-3 flex flex-col justify-between"
                style={{
                    background: 'radial-gradient(circle, rgba(252, 235, 236, 0.5), rgba(232, 120, 130, 0.5))'
                }}
            >
                <div className="text-center">
                    <div className="text-[#0A468C] text-[24px] leading-[32px] font-bold">42%</div>
                </div>

                <div className="text-center text-[12px] leading-[16px] font-medium tracking-[0.2%] text-[#212529]">
                    Accuracy
                </div>
            </div>
        </div>
    )
}