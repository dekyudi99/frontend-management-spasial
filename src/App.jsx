import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import idID from 'antd/locale/id_ID'
import thTH from 'antd/locale/th_TH'
import routes from './router/Routes'
import { LanguageProvider, useLanguage } from './context/LanguageContext'

const AppWithLocale = () => {
  const { language } = useLanguage()
  const antdLocale = language === 'id' ? idID : language === 'th' ? thTH : enUS

  return (
    <ConfigProvider locale={antdLocale}>
      <RouterProvider router={routes} />
    </ConfigProvider>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppWithLocale />
    </LanguageProvider>
  )
}

export default App
