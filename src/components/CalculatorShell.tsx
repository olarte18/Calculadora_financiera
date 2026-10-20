import { operationGroups } from '../features/operations/operationCatalog'

export function CalculatorShell() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Inicio de la calculadora financiera">
          <span className="brand-mark" aria-hidden="true">∑</span>
          <span>Finanzas<span className="brand-light"> Económicas</span></span>
        </a>
        <span className="course-label">INGENIERÍA ECONÓMICA</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Herramienta académica</p>
        <h1 id="page-title">Calculadora financiera</h1>
        <p className="intro-copy">
          Explora operaciones del valor del dinero en el tiempo y verifica cada
          resultado con el procedimiento financiero correspondiente.
        </p>
      </section>

      <section className="workspace" aria-label="Operaciones financieras">
        <aside className="operation-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operaciones</p>
              <h2>Elige una operación</h2>
            </div>
            <span className="operation-count">{operationGroups.flatMap((group) => group.operations).length}</span>
          </div>

          <nav className="operation-list" aria-label="Tipos de operación">
            {operationGroups.map((group) => (
              <div className="operation-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.operations.map((operation) => (
                  <button className="operation-option" key={operation.id} type="button" disabled>
                    <span className="operation-icon" aria-hidden="true">{operation.icon}</span>
                    <span>{operation.label}</span>
                    <span className="coming-soon" aria-label="Disponible próximamente">›</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="calculator-panel" aria-labelledby="welcome-title">
          <div className="welcome-icon" aria-hidden="true">ƒ</div>
          <p className="eyebrow">Espacio de cálculo</p>
          <h2 id="welcome-title">Tus cálculos empiezan aquí</h2>
          <p>
            Selecciona una operación para identificar sus datos, periodicidades
            y variable desconocida. El resultado incluirá el procedimiento aplicado.
          </p>
          <div className="planned-features">
            <span><span className="status-dot" /> Unidades y tasas claras</span>
            <span><span className="status-dot" /> Resultados verificables</span>
          </div>
        </section>
      </section>

      <footer className="page-footer">
        <span>Calculadora financiera · Proyecto de Ingeniería Económica</span>
        <span>Versión inicial</span>
      </footer>
    </main>
  )
}
