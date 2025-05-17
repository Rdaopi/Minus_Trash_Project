<template>
    <div v-if="show" :class="['notification', type]">
        <i :class="icon"></i>
        {{ message }}
    </div>
</template>

<script>
export default {
    name: 'Notification',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'success',
            validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
        }
    },
    computed: {
        icon() {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            return icons[this.type];
        }
    }
};
</script>

<style scoped>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.3s ease-out;
    z-index: 1000;
}

.success {
    background-color: #4CAF50;
    color: white;
}

.error {
    background-color: #f44336;
    color: white;
}

.warning {
    background-color: #ff9800;
    color: white;
}

.info {
    background-color: #2196F3;
    color: white;
}

.notification i {
    font-size: 1.2rem;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style> 