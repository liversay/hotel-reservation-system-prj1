import { Link } from 'react-router-dom'

interface ButtonProps {
  content: string
  className: string
  to: string
}

export default function ButtonSecondary({ content, className, to }: ButtonProps) {
  return (
    <Link to={to} className={`block rounded-lg bg-orange-200 px-5 py-2.5 text-sm font-medium text-orange-600 transition hover:text-orange-500 ${className}`}>
      {content}
    </Link>
  )
}
