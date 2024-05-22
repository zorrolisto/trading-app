import Image from "next/image";

const stepsGuia = [
  {
    text: "Aquí se puede ver el precio actual de las acciones de MSFT y podrás comprar esas acciones.",
    image: "https://i.ibb.co/y4WCmhd/Screenshot-2024-05-21-at-21-03-46.png",
  },
  {
    text: "Aquí están tus acciones de MSFT que has comprado, puedes venderlas todas pulsando 'Vender'.",
    image: "https://i.ibb.co/9Yh1zN7/Screenshot-2024-05-21-at-21-03-57.png",
  },
  {
    text: "En este recuadro verás tu dinero, puedes aumentar 1000$ cada vez que des click en el botón '+'.",
    image: "https://i.ibb.co/YcPk84X/Screenshot-2024-05-21-at-21-04-35.png",
  },
  {
    text: "Este manual está disponible aquí, solo le das click en 'Abrir'.",
    image: "https://i.ibb.co/frxL4mS/Screenshot-2024-05-21-at-21-05-05.png",
  },
  {
    text: "En este chart verás cómo van las acciones de MSFT, pudiendo cambiar el filtro de tiempo.",
    image: "https://i.ibb.co/27ZgjgB/Screenshot-2024-05-21-at-21-04-46.png",
    width: 750,
  },
  {
    text: "Aquí podrás conversar con el Bot de Trading sobre noticias, consejos, información de la bolsa de MSFT, y lo más importante PREDICCIONES DE LA BOLSA MSFT.",
    image: "https://i.ibb.co/HTMxJ0L/Screenshot-2024-05-21-at-21-05-35.png",
  },
  {
    text: "Dándole click en la imagen de usuario podrás ver tus opciones de usuario.",
    image: "https://i.ibb.co/vX7J8fW/Screenshot-2024-05-21-at-20-41-51.png",
  },
];

export default function ManualDeUsuario() {
  return (
    <dialog id="my_modal_2" className="modal">
      <div className="modal-box w-11/12 max-w-5xl overflow-auto">
        <form method="dialog">
          <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="text-center text-lg font-bold">Manual de Usuario</h3>
        <p className="py-4 text-sm">
          A continuación se presentará las instrucciones paras usar la
          plataforma.
        </p>
        <div className="divider"></div>
        <ul className="">
          {stepsGuia.map((s, idx) => (
            <>
              <li key={idx} className="">
                <p className="mb-3 text-sm">
                  {idx + 1}. {s.text}
                </p>
                <div className="flex justify-center">
                  <Image
                    src={s.image}
                    alt="stext"
                    width={s.width ? s.width : 300}
                    height={150}
                  />
                </div>
              </li>
              {idx !== stepsGuia.length - 1 && <div className="divider"></div>}
            </>
          ))}
        </ul>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
