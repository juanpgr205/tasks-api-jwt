export function createAuthController(service) {
  return {
    async register(req, res) {
      res.status(201).json(await service.register(req.body));
    },
    async login(req, res) {
      res.json(await service.login(req.body));
    },
    me(req, res) {
      res.json(req.user);
    },
  };
}
