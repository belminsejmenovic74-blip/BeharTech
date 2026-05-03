/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Désactivé en dev : le compilateur React peut fortement ralentir le serveur / le hot reload */
  reactCompiler: process.env.NODE_ENV === "production",
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
