const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async login(users, email, password) {
    await wait();
    const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!user) throw new Error('Invalid email or password.');
    if (user.status === 'deactivated') throw new Error('This account has been deactivated.');
    return user;
  },
  async submitCase(payload) {
    await wait(500);
    return payload;
  },
  async save() {
    await wait(120);
    return true;
  },
};
