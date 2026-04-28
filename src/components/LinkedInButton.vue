<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  url: String,
})

// Splits the label into characters so the animation works on each letter
const characters = computed(() => props.label.split(''))
</script>

<template>
  <a :href="url" target="_blank" class="linkedin-button-wrapper">
    <button class="button">
      <div class="outline"></div>
      <div class="state state--default">
        <div class="icon">
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g style="filter: url(#shadow)">
              <path
                d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                fill="currentColor"
              />
              <path
                d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <filter id="shadow">
                <fedropshadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.5" />
              </filter>
            </defs>
          </svg>
        </div>
        <p>
          <span v-for="(char, index) in characters" :key="index" :style="{ '--i': index }">
            {{ char === ' ' ? '\u00A0' : char }}
          </span>
        </p>
      </div>
    </button>
  </a>
</template>

<style scoped>
/* Paste the CSS from your txt file here */
/* Note: I've kept the core logic from [cite: 10-58] */

.linkedin-button-wrapper {
  text-decoration: none;
  display: inline-block;
}

.button {
  --primary: #0077b5; /* Changed to LinkedIn Blue */
  --neutral-1: #f7f8f7;
  --neutral-2: #e7e7e7;
  --radius: 14px;
  cursor: pointer;
  border-radius: var(--radius);
  border: none;
  box-shadow:
    0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2),
    0 10px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  min-width: 180px;
  padding: 12px 24px;
  height: 50px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  background: white;
}

.button:hover {
  transform: scale(1.02);
}

.state p {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.state .icon {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  margin: auto;
  transform: scale(1.25);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.button:hover .icon {
  transform: rotate(45deg) scale(1.25);
  color: var(--primary);
}

.state p span {
  display: block;
  opacity: 0;
  animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
}

.button:hover p span {
  opacity: 1;
  animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
}

@keyframes wave {
  30% {
    opacity: 1;
    transform: translateY(4px);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
    color: var(--primary);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Simplified Outline from [cite: 24-28] */
.outline {
  position: absolute;
  border-radius: inherit;
  overflow: hidden;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.4s ease;
  inset: -2px;
}
.button:hover .outline {
  opacity: 1;
  border: 2px solid var(--primary);
}
</style>
