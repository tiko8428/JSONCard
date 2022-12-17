import {
  UserOutlined
} from '@ant-design/icons';


export const getRouter = (user) => {
  const adminRouter = [
    {
      label: 'Admin', type: 'group', key: 'admin', mode: "vertical", icon: <UserOutlined />,
      children: [
        // { label: 'dashboard', key: 'dashboard', onClick:()=>{console.log("login")} },
        { label: 'users', key: 'users' },
        { type: 'divider', }
      ],
    }
  ];

  const languages = [
    {
      label: 'A1',
      key: 'A1',
      children: [
        { label: 'de', key: 'A1/de' },
        { label: 'ua', key: 'A1/ua' },
        { label: 'ru', key: 'A1/ru' },
        { label: 'en', key: 'A1/en' },
      ],
    },
    {
      label: 'A2',
      key: 'A2',
      // disabled: true,
      children: [
        { label: 'de', key: 'A2/de' },
        { label: 'ua', key: 'A2/ua' },
        { label: 'ru', key: 'A2/ru' },
        { label: 'en', key: 'A2/en' },
      ],
    },
    {
      label: 'B1',
      key: 'B1',
      // disabled: true,
      children: [
        { label: 'de', key: 'B1/de' },
        { label: 'ua', key: 'B1/ua' },
        { label: 'ru', key: 'B1/ru' },
        { label: 'en', key: 'B1/en' },
      ],
    },
    {
      label: 'B2',
      key: 'B2',
      // disabled: true,
      children: [
        { label: 'de', key: 'B2/de' },
        { label: 'ua', key: 'B2/ua' },
        { label: 'ru', key: 'B2/ru' },
        { label: 'en', key: 'B2/en' },
      ],
    },

    {
      label: 'C1',
      key: 'C1',
      // disabled: true,
      children: [
        { label: 'de', key: 'C1/de' },
        { label: 'ua', key: 'C1/ua' },
        { label: 'ru', key: 'C1/ru' },
        { label: 'en', key: 'C1/en' },
      ],
    },
  ];


  let router = []
  if (user?.rol === "admin") {
    router = [...router, ...adminRouter, ...languages]
  } else if (!user) {
    router = []
  }
  if (user && user.rol !== "admin" && user.rol.length > 0) {

    user.rol.forEach(lang => {
      const currentRout = router.find(rout => rout.key === lang.laval)
      if (!currentRout) {
        router.push({
          label: lang.laval,
          key: lang.laval,
          children: [
            { label: lang.language, key: `${lang.laval}/${lang.language}` },
          ],
        })
      } else {
        currentRout.children.push({ label: lang.language, key: `${lang.laval}/${lang.language}` })
      }
    })
  }
  return router
}
