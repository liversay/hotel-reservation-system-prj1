// Sin fotos en el backend: placeholder local (sin hosts externos).
export default function RoomPhoto({ className = '' }: { className?: string }) {
  return (
    <div role="img" aria-label="Sin foto disponible" className={`flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-300 text-orange-700 ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      </svg>
    </div>
  )
}
