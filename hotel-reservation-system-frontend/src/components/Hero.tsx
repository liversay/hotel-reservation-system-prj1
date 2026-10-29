import Button from "./Button";
import Search from "./Search";

export default function Hero() {
  return (
      <section
        className="overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
          <Search/>
        <div className="bg-black/80 p-8 md:p-12 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-xl text-center ltr:sm:text-left rtl:sm:text-right">
            <h1 className="text-6xl font-bold text-orange-500 lg:text-7xl md:text-4xl mt-10 lg:mt-16">
              HOTEL  
            </h1>
            <h1 className="text-6xl font-bold text-orange-600 lg:text-7xl md:text-4xl mt-2 lg:mt-16">
              FROM 
            </h1>
            <h1 className="text-6xl font-bold text-orange-700 lg:text-7xl md:text-4xl mt-2 lg:mt-16">
              DREAMS
            </h1>
            <p className="hidden text-gray-300 md:mt-10 md:block">
              Encuentra y reserva tu habitación ideal.
            </p>
            <div className="mt-4 md:mt-8">
              <Button to="/products" content="Explorar habitaciones" className="px-12 py-3"/>
            </div>
          </div>
        </div>
      </section>
  )
}
