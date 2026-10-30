import RoomPhoto from './RoomPhoto'

export default function AboutUs() {
  return (
    <section className="flex w-full flex-col items-center justify-center py-2">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-10 sm:px-6">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="container grid max-w-6xl items-center gap-8 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Sistema de reservas de hotel</h2>
              <p className="text-muted-foreground md:text-lg">
                Este sitio es un proyecto académico que permite consultar hoteles y habitaciones, ver su disponibilidad
                en un calendario y reservar con pago simulado.
              </p>
              <p className="text-muted-foreground">
                Los clientes pueden registrarse, guardar una tarjeta de prueba, reservar y cancelar sus reservas.
                Las personas administradoras gestionan hoteles, habitaciones y usuarios desde un panel propio.
              </p>
            </div>
            <RoomPhoto className="aspect-video w-full rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
