<!-- GoogleSignIn.vue -->
<template>
  <button 
    @click="signInWithGoogle" 
    class="google-btn"
    :disabled="loading"
  >
    <img 
      src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png" 
      alt="Google logo"
    />
    {{ loading ? 'Loading...' : 'Sign in with Google' }}
  </button>
</template>

<script>
export default {
  name: 'GoogleSignIn',
  data() {
    return {
      loading: false
    }
  },
  methods: {
    signInWithGoogle() {
      this.loading = true;
      // Redirect to backend Google OAuth route
      //http://localhost:5000
      window.location.href = `http://localhost:5000/api/auth/googleOAuth/login`;
      //window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/googleOAuth/login`;
    }
  }
}
</script>

<style scoped>
.google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 2.5rem;
    background-color: var(--background2-color);
    color: #000;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    width: 100%;
    max-width: 300px;
    margin: 10px auto;
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
    position: relative;
    overflow: hidden;
}

.google-btn:hover {
    background-color: #388e3c;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
    animation: pulseGlow 1.5s infinite;
    outline: none;
    color: #fff;
}

.google-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-btn img {
  width: 18px;
  height: 18px;
}
</style> 