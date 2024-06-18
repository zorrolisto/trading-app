import type { ISimulationHTMLs } from "~/types";

export default function Simulation(props: {
  simulationHtmls: ISimulationHTMLs | undefined;
}) {
  return (
    <dialog id="my_modal_3" className="modal">
      <div className="modal-box w-11/12 max-w-5xl overflow-auto">
        <form method="dialog">
          <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="text-center text-lg font-bold">
          Resultado de Simulación
        </h3>
        {props.simulationHtmls && (
          <div>
            <iframe
              title="Trades Content"
              srcDoc={props.simulationHtmls.trades_content}
              style={{
                width: "100%",
                minHeight: "500px",
                border: "none",
                borderRadius: "1rem",
              }}
            />
            <div className="divider"></div>
            <iframe
              title="Plot Content"
              srcDoc={props.simulationHtmls.plot_content}
              style={{
                width: "100%",
                minHeight: "500px",
                border: "none",
              }}
            />
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
