export const userLogin = (req, res) => {
    const username = req.params.username;
    res.send(`User ${username} logged in successfully!`);
}

export const userSignup = (req, res) => {
    const username = req.params.username;
    res.send(`User ${username} signed up successfully!`);
}