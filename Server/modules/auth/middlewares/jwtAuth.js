//Mock del middleware JWT per testing e sviluppo
export const jwtAuth = (req, res, next) => {
    //Mock user per testing
    req.user = {
        id: "mock_user_id",
        email: "test@example.com",
        role: "user",
        name: "Test User"
    };
    
    //Log per debugging
    console.log("//Mock JWT Auth: Utente autenticato:", req.user);
    
    //Procedi con la richiesta
    next();
}; 