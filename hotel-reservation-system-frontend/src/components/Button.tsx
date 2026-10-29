import { Link } from 'react-router-dom'

interface ButtonProps {
  content: string
  className: string
  to?: string
}

export default function Button({ content, className, to = '/products' }: ButtonProps) {
  return (
    <Link to={to} className={`inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 focus:outline-none focus:ring focus:ring-orange-400 ${className}`}>
      {content}
    </Link>
  )
}
