import { UserOutlined } from "@ant-design/icons";

export const getRouter = (user) => {
  const adminRouter = [
    {
      label: "Admin",
      type: "group",
      key: "admin",
      mode: "vertical",
      icon: <UserOutlined />,
      children: [{ label: "users", key: "users" }, { type: "divider" }],
    },
  ];

  const loginRoute = {
    label: "Login",
    key: "login",
  };

  const logoutRoute = {
    label: "Logout",
    key: "logout",
  };
  const style = { textTransform: "uppercase", fontWeight: "600" }
 
  const languages = [
    {
      label: "A1",
      key: "A1",
      style: { textTransform: "uppercase" },
      children: [
        { label: "de", key: "A1/de", style },
        { label: "ua", key: "A1/ua",style },
        { label: "ru", key: "A1/ru",style },
        { label: "en", key: "A1/en", style },
        { label: "hy", key: "A1/hy",style },
        { label: "es", key: "A1/es",style },
        { label: "ar", key: "A1/ar",style },
        { label: "tr", key: "A1/tr",style },
        { label: "fr", key: "A1/fr",style },
      ],
    },
    {
      label: "A2",
      key: "A2",
      children: [
        { label: "de", key: "A2/de", style },
        { label: "ua", key: "A2/ua", style },
        { label: "ru", key: "A2/ru", style },
        { label: "en", key: "A2/en", style },
        { label: "hy", key: "A2/hy", style },
        { label: "es", key: "A2/es", style },
        { label: "ar", key: "A2/ar", style },
        { label: "tr", key: "A2/tr", style },
        { label: "fr", key: "A2/fr", style },
      ],
    },
    {
      label: "B1",
      key: "B1",
      children: [
        { label: "de", key: "B1/de", style },
        { label: "ua", key: "B1/ua", style },
        { label: "ru", key: "B1/ru", style },
        { label: "en", key: "B1/en", style },
        { label: "hy", key: "B1/hy", style },
        { label: "es", key: "B1/es", style },
        { label: "ar", key: "B1/ar", style },
        { label: "tr", key: "B1/tr", style },
        { label: "fr", key: "B1/fr", style },
      ],
    },
    {
      label: "B2",
      key: "B2",
      children: [
        { label: "de", key: "B2/de", style },
        { label: "ua", key: "B2/ua", style },
        { label: "ru", key: "B2/ru", style },
        { label: "en", key: "B2/en", style },
        { label: "hy", key: "B2/hy", style },
        { label: "es", key: "B2/es", style },
        { label: "ar", key: "B2/ar", style },
        { label: "tr", key: "B2/tr", style },
        { label: "fr", key: "B2/fr", style },
      ],
    },

    {
      label: "C1",
      key: "C1",
      children: [
        { label: "de", key: "C1/de", style },
        { label: "ua", key: "C1/ua", style },
        { label: "ru", key: "C1/ru", style },
        { label: "en", key: "C1/en", style },
        { label: "hy", key: "C1/hy", style },
        { label: "es", key: "C1/es", style },
        { label: "ar", key: "C1/ar", style },
        { label: "tr", key: "C1/tr", style },
        { label: "fr", key: "C1/fr", style },
      ],
    },
  ];

  let router = [];

  if (user?.rol) {
    router.push(logoutRoute);
  } else {
    router.push(loginRoute);
  }

  if (user?.rol === "admin") {
    router = [...router, ...adminRouter, ...languages];
  } else if (!user) {
    router = [];
  }
  if (user && user.rol !== "admin" && user.rol.length > 0) {
    user.rol.forEach((lang) => {
      const currentRout = router.find((rout) => rout.key === lang.laval);
      if (!currentRout) {
        router.push({
          label: lang.laval,
          key: lang.laval,
          children: [
            { label: lang.language, key: `${lang.laval}/${lang.language}` },
          ],
        });
      } else {
        currentRout.children.push({
          label: lang.language,
          key: `${lang.laval}/${lang.language}`,
        });
      }
    });
  }
  return router;
};
