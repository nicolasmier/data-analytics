import { render, screen } from '@testing-library/react'
import App from './App'
import { AppProvider } from './state/store'

function renderApp() {
  return render(
    <AppProvider>
      <App />
    </AppProvider>,
  )
}

describe('App', () => {
  it('muestra el título y la zona de carga', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Analiza tus inscripciones')
    expect(screen.getByText('Arrastra tus Excel aquí')).toBeInTheDocument()
  })

  it('muestra el aviso de privacidad sin mencionar datos prohibidos', () => {
    renderApp()
    expect(screen.getByText(/No se leen DNI ni teléfonos/i)).toBeInTheDocument()
  })
})
