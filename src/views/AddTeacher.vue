<script setup>
import { ref, reactive, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { UserPlus, Mail, Lock, Phone, User, Calendar, MapPin } from 'lucide-vue-next'

const router = useRouter()

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

// Rediriger si pas admin
if (!props.user || props.user.role !== 'admin') {
  router.push('/courses')
}

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const teacherData = reactive({
  name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  gender: 'M',
  birthday: '',
  city: '',
})

const handleSubmit = async () => {
  error.value = ''
  successMessage.value = ''

  if (
    !teacherData.name ||
    !teacherData.last_name ||
    !teacherData.email ||
    !teacherData.password ||
    !teacherData.phone ||
    !teacherData.gender
  ) {
    error.value = 'Veuillez remplir tous les champs obligatoires'
    return
  }

  loading.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:3000/api/auth/register-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(teacherData),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erreur lors de la création')
    }

    const data = await response.json()
    successMessage.value = 'Enseignant créé avec succès!'

    // Réinitialiser le formulaire après 2 secondes
    setTimeout(() => {
      Object.assign(teacherData, {
        name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        gender: 'M',
        birthday: '',
        city: '',
      })
      successMessage.value = ''
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Erreur lors de la création'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="add-teacher-page min-h-[calc(100vh-200px)] py-12">
    <div
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="max-w-4xl mx-auto rounded-3xl shadow-2xl p-8"
    >
      <!-- En-tête -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-300 to-blue-700 rounded-full mb-4"
        >
          <UserPlus :size="32" class="text-white" />
        </div>
        <h1
          :class="props.darkMode ? 'text-white' : 'text-gray-900'"
          class="text-3xl font-bold mb-2"
        >
          Ajouter un Enseignant
        </h1>
        <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'">
          Créer un compte enseignant avec accès aux outils pédagogiques
        </p>
      </div>

      <!-- Messages -->
      <div
        v-if="error"
        class="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg"
      >
        <p class="font-semibold">❌ {{ error }}</p>
      </div>

      <div
        v-if="successMessage"
        class="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg"
      >
        <p class="font-semibold">✅ {{ successMessage }}</p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Informations personnelles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Prénom -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Prénom <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.name"
                type="text"
                required
                placeholder="Ex: Mohammed"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- Nom -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Nom <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.last_name"
                type="text"
                required
                placeholder="Ex: Benali"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Genre -->
        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-2"
          >
            Civilité <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="teacherData.gender"
                value="M"
                class="w-5 h-5 text-blue-600"
              />
              <span :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'" class="font-medium">
                Monsieur (M.)
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="teacherData.gender"
                value="F"
                class="w-5 h-5 text-blue-600"
              />
              <span :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'" class="font-medium">
                Madame (Mme.)
              </span>
            </label>
          </div>
        </div>

        <!-- Email et Téléphone -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Email -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Email <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.email"
                type="email"
                required
                placeholder="enseignant@usto.dz"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- Téléphone -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Téléphone <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.phone"
                type="tel"
                required
                placeholder="0555 12 34 56"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Date de naissance et Ville -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Date de naissance -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Date de naissance
            </label>
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.birthday"
                type="date"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- Ville -->
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Ville
            </label>
            <div class="relative">
              <MapPin class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.city"
                type="text"
                placeholder="Ex: Oran"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Mot de passe -->
        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-2"
          >
            Mot de passe <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
            <input
              v-model="teacherData.password"
              type="password"
              required
              placeholder="Mot de passe sécurisé"
              :class="
                props.darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200'
              "
              class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs mt-1">
            Minimum 8 caractères recommandés
          </p>
        </div>

        <!-- Boutons d'action -->
        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Création en cours...' : ' Créer le compte enseignant' }}
          </button>

          <button
            type="button"
            @click="router.push('/courses')"
            :class="
              props.darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            "
            class="px-8 py-4 rounded-xl font-semibold transition-all"
          >
            Annuler
          </button>
        </div>
      </form>

      <!-- Note informative -->
      <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <strong>📌 Note:</strong> L'enseignant pourra se connecter avec l'email et le mot de passe
          définis. Il aura accès aux outils pédagogiques et pourra gérer ses cours.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-teacher-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
