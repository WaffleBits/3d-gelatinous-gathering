export function Loader() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="relative w-24 h-24">
        <div className="absolute w-full h-full rounded-full border-4 border-t-primary animate-spin"></div>
        <div className="absolute w-full h-full flex items-center justify-center text-primary-foreground">
          <span className="text-sm font-bold">LOADING</span>
        </div>
      </div>
    </div>
  )
}

