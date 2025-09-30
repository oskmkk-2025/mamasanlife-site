export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t bg-white">
      <div className="container-responsive py-6 text-xs text-gray-600 text-center">
        © {year} hi-chi Blog. All rights reserved.
      </div>
    </footer>
  )
}
