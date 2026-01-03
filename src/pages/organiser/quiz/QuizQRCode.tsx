import QRCode from 'react-qr-code'
import { FiX } from 'react-icons/fi'

interface QuizQRCodeProps {
    quizId: string
    quizName: string
    onClose: () => void
}

export default function QuizQRCode({ quizId, quizName, onClose }: QuizQRCodeProps) {
    // Construct the URL where participants can take the quiz
    // Assuming the route is /dashboard/my-events/quiz/:quizId or similar for participants
    // OR /event/:slug/quiz/:quizId
    // For now, I'll use a placeholder URL structure that seems standard - verify later
    const origin = window.location.origin
    const quizUrl = `${origin}/quiz/${quizId}` // Updated to a simple root route for now, can be adjusted

    /*
    const downloadQR = () => {
        const svg = document.getElementById("quiz-qr-code")
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL("image/png")
            const downloadLink = document.createElement("a")
            downloadLink.download = `${quizName}-QR.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }
        img.src = "data:image/svg+xml;base64," + btoa(svgData)
    }
    */

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 relative">
                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <FiX className="w-6 h-6" />
                </button>

                <div className="text-center space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Quiz QR Code</h2>
                        <p className="text-sm text-slate-400 mt-1">{quizName}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl inline-block">
                        <QRCode 
                            id="quiz-qr-code"
                            value={quizUrl}
                            size={200}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="H"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                             <p className="text-xs text-slate-500 mb-1">Quiz URL</p>
                             <p className="text-blue-400 text-sm break-all font-mono">{quizUrl}</p>
                        </div>

                        {/* Download button - simpler SVG download approach or just let user screenshot */}
                         {/* <button 
                            onClick={downloadQR}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
                        >
                            <FiDownload /> Download QR
                        </button> */}
                         <p className="text-xs text-slate-500">Scan this code to access the quiz directly.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
