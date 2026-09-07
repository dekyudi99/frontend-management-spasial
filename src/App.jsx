import { RouterProvider } from 'react-router-dom'
import routes from './router/Routes'

function App() {
  return (
    <>
      <div>
        <RouterProvider router={routes} />
      </div>
    </>
  )
}

export default App
