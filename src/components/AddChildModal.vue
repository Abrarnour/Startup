<script setup>
import { ref, reactive } from 'vue'
import { X, UserPlus, Link, Calendar, MapPin, Mail, Lock, User } from 'lucide-vue-next'
import * as api from '../services/api.js'
// Inside <script setup>
import { useLanguage } from '../composables/useLanguage.js' // Add this
const { t } = useLanguage()
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'child-added'])

// État
const mode = ref('choose') // 'choose', 'new', 'existing'
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Formulaire nouvel enfant
const newChildForm = reactive({
  name: '',
  last_name: '',
  email: '',
  password: '',
  birthday: '',
  city: '',
  gender: 'M',
})

// Formulaire {{ t('mode_existing_child') }}
const existingChildEmail = ref('')

// Réinitialiser le formulaire
const resetForm = () => {
  Object.assign(newChildForm, {
    name: '',
    last_name: '',
    email: '',
    password: '',
    birthday: '',
    city: '',
    gender: 'M',
  })
  existingChildEmail.value = ''
  error.value = ''
  successMessage.value = ''
}

// Créer un nouvel enfant
const handleCreateNewChild = async () => {
  error.value = ''
  successMessage.value = ''

  // Validation
  if (
    !newChildForm.name ||
    !newChildForm.last_name ||
    !newChildForm.email ||
    !newChildForm.password ||
    !newChildForm.birthday ||
    !newChildForm.gender
  ) {
    error.value = 'Veuillez remplir tous les champs obligatoires'
    return
  }

  loading.value = true

  try {
    await api.registerChild(newChildForm)
    successMessage.value = ' Enfant créé et ajouté avec succès!'
    setTimeout(() => {
      emit('child-added')
      closeModal()
    }, 1500)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Lier un {{ t('mode_existing_child') }}
const handleLinkExistingChild = async () => {
  error.value = ''
  successMessage.value = ''

  if (!existingChildEmail.value) {
    error.value = "Veuillez saisir l'email de votre enfant"
    return
  }

  loading.value = true

  try {
    // D'abord vérifier si l'email existe
    const checkResult = await api.checkStudentEmail(existingChildEmail.value)

    if (!checkResult.exists) {
      error.value = 'Aucun étudiant trouvé avec cet email. Voulez-vous créer un Nouveau child ?'
      loading.value = false
      return
    }

    // Lier l'enfant
    await api.linkExistingChild(existingChildEmail.value)
    successMessage.value = ' Enfant lié avec succès!'
    setTimeout(() => {
      emit('child-added')
      closeModal()
    }, 1500)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Fermer la modal
const closeModal = () => {
  resetForm()
  mode.value = 'choose'
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 m-4"
    >
      <!-- Bouton Fermer -->
      <button
        @click="closeModal"
        :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        class="absolute top-4 right-4 transition-colors"
      >
        <X :size="24" />
      </button>

      <!-- Titre -->
      <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
        <UserPlus :size="32" class="text-blue-500" />
        {{ t('add_child_title') }}
      </h2>

      <!-- Messages -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
        {{ error }}
      </div>
      <div
        v-if="successMessage"
        class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300"
      >
        {{ successMessage }}
      </div>

      <!-- Choix du mode -->
      <div v-if="mode === 'choose'" class="space-y-4">
        <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="mb-6">
          Votre enfant a-t-il déjà un compte étudiant?
        </p>

        <button
          @click="mode = 'existing'"
          :class="
            darkMode
              ? 'bg-blue-800 hover:bg-blue-700 text-white'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
          "
          class="w-full p-6 rounded-xl border-2 border-blue-500 transition-all flex items-center gap-4"
        >
          <Link :size="32" class="text-blue-500" />
          <div class="text-left">
            <h3 class="text-xl font-bold">Oui, il a déjà un compte</h3>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mt-1">
              Lier son compte existant à mon profil parent
            </p>
          </div>
        </button>

        <button
          @click="mode = 'new'"
          :class="
            darkMode
              ? 'bg-green-800 hover:bg-green-700 text-white'
              : 'bg-green-100 hover:bg-green-200 text-green-800'
          "
          class="w-full p-6 rounded-xl border-2 border-green-500 transition-all flex items-center gap-4"
        >
          <UserPlus :size="32" class="text-green-500" />
          <div class="text-left">
            <h3 class="text-xl font-bold">Non, créer un {{ t('mode_new_child') }}</h3>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mt-1">
              Créer un compte étudiant pour mon enfant
            </p>
          </div>
        </button>
      </div>

      <!-- Formulaire {{ t('mode_existing_child') }} -->
      <div v-if="mode === 'existing'" class="space-y-6">
        <button
          @click="mode = 'choose'"
          :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'"
          class="flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>

        <div>
          <label class="block mb-2 font-semibold flex items-center gap-2">
            <Mail :size="18" />
            Email de votre enfant *
          </label>
          <input
            v-model="existingChildEmail"
            type="email"
            placeholder="exemple@student.dz"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          @click="handleLinkExistingChild"
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Liaison en cours...' : 'Lier cet enfant' }}
        </button>
      </div>

      <!-- Formulaire nouvel enfant -->
      <div v-if="mode === 'new'" class="space-y-6">
        <button
          @click="mode = 'choose'"
          :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'"
          class="flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-semibold flex items-center gap-2">
              <User :size="18" />
              {{ t('first_name') }} *
            </label>
            <input
              v-model="newChildForm.name"
              type="text"
              placeholder="{{ t('first_name') }}"
              :class="
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
              class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block mb-2 font-semibold flex items-center gap-2">
              <User :size="18" />
              Nom *
            </label>
            <input
              v-model="newChildForm.last_name"
              type="text"
              placeholder="Nom"
              :class="
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
              class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block mb-2 font-semibold flex items-center gap-2">
            <Mail :size="18" />
            Email *
          </label>
          <input
            v-model="newChildForm.email"
            type="email"
            placeholder="exemple@student.dz"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block mb-2 font-semibold flex items-center gap-2">
            <Lock :size="18" />
            {{ t('password') }} *
          </label>
          <input
            v-model="newChildForm.password"
            type="password"
            placeholder="••••••••"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-semibold flex items-center gap-2">
              <Calendar :size="18" />
              {{ t('birthday') }} *
            </label>
            <input
              v-model="newChildForm.birthday"
              type="date"
              :class="
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
              class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block mb-2 font-semibold">{{ t('gender') }} *</label>
            <select
              v-model="newChildForm.gender"
              :class="
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
              class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="M">{{ t('gender_m') }}</option>
              <option value="F">{{ t('gender_f') }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block mb-2 font-semibold flex items-center gap-2">
            <MapPin :size="18" />
            {{ t('city') }}
          </label>
          <input
            v-model="newChildForm.city"
            type="text"
            placeholder="Oran, Alger, etc."
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          @click="handleCreateNewChild"
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Création en cours...' : 'Créer et ajouter' }}
        </button>
      </div>
    </div>
  </div>
</template>
