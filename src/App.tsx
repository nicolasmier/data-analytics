import { ErrorState } from './components/common/ErrorState'
import { LoadingScreen } from './components/common/LoadingScreen'
import { Dashboard } from './components/dashboard/Dashboard'
import { MappingScreen } from './components/mapping/MappingScreen'
import { UploadScreen } from './components/upload/UploadScreen'
import { useApp } from './state/store'

function App() {
  const { state } = useApp()

  return (
    <div className="app-shell">
      <header
        className="app-header"
        style={{ backgroundImage: 'url(./fondoweb.jpeg)' }}
      >
        <div className="app-header-overlay">
          <h1>Análisis base de datos empa-t</h1>
        </div>
      </header>
      <main className="app-main">
        {state.status === 'idle' ? <UploadScreen /> : null}
        {state.status === 'loading' ? <LoadingScreen /> : null}
        {state.status === 'mapping' ? <MappingScreen /> : null}
        {state.status === 'ready' ? <Dashboard /> : null}
        {state.status === 'error' ? <ErrorState /> : null}
      </main>
    </div>
  )
}

export default App
