
export default function ExamWebHeader() {
    return (
        <div className="flex justify-between items-center px-5 py-4">
            {/* Left Image */}
            <img src="/assets/student/logo.svg" alt="Icon" className="h-[34px] ml-[20px]" />

            {/* Right Button */}
            <button className="flex items-center h-[40px] px-[16px] py-[8px] bg-white border-2 border-[#19A0E6] rounded-full gap-[8px]">
                <img src="/assets/student/support-icon.svg" alt="Icon" className="h-[24px] w-[24px]" />
                <span className="text-[#0A468C] text-[16px] font-medium">Support</span>
            </button>
        </div>
    )
}