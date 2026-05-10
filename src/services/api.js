// frontend/src/services/api.js
const API_URL =
  import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'

const getToken = () => localStorage.getItem('token')

const getHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// ============= AUTHENTIFICATION =============

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur de connexion')
  }

  const data = await response.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Erreur d'inscription")
  }

  const data = await response.json()
  if (data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  return data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// ============= COURS =============

export const getCourses = async () => {
  const response = await fetch(`${API_URL}/courses`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des cours')
  }

  return await response.json()
}

export const getCourse = async (id) => {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Cours non trouvé')
  }

  return await response.json()
}

export const createCourse = async (courseData) => {
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(courseData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la création du cours')
  }

  return await response.json()
}

export const updateCourse = async (id, courseData) => {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(courseData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la modification du cours')
  }

  return await response.json()
}

export const deleteCourse = async (id) => {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression du cours')
  }

  return await response.json()
}

export const toggleFavorite = async (courseId) => {
  const response = await fetch(`${API_URL}/courses/${courseId}/favorite`, {
    method: 'POST',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la gestion des favoris')
  }

  return await response.json()
}

// ============= ENSEIGNANTS =============

export const getTeachersList = async () => {
  const response = await fetch(`${API_URL}/courses/teachers/list`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des enseignants')
  }

  return await response.json()
}

export const deleteTeacher = async (teacherId) => {
  const response = await fetch(`${API_URL}/auth/users/${teacherId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression')
  }

  return response.json()
}

export const getTeacherStats = async () => {
  const response = await fetch(`${API_URL}/stats/teacher`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur stats enseignant')
  }

  return response.json()
}
// ============= STATISTIQUES =============

// ============= COURS PUBLICS =============

export const getPublicCourses = async () => {
  const response = await fetch(`${API_URL}/public/courses`)

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des cours')
  }

  return await response.json()
}

export const getPublicCourse = async (id) => {
  const response = await fetch(`${API_URL}/public/courses/${id}`)

  if (!response.ok) {
    throw new Error('Cours non trouvé')
  }

  return await response.json()
}

// ============= PARENTS =============

export const getMyChildren = async () => {
  const response = await fetch(`${API_URL}/parents/children`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des enfants')
  }

  return await response.json()
}

export const createChild = async (childData) => {
  const response = await fetch(`${API_URL}/parents/children/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(childData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la création')
  }

  return await response.json()
}

export const linkChild = async (childData) => {
  const response = await fetch(`${API_URL}/parents/children/link`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(childData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la liaison')
  }

  return await response.json()
}

export const getChildEnrollments = async (studentId) => {
  const response = await fetch(`${API_URL}/parents/children/${studentId}/enrollments`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des inscriptions')
  }

  return await response.json()
}

export const getAvailableCourses = async (studentId) => {
  const response = await fetch(`${API_URL}/parents/available-courses/${studentId}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des cours disponibles')
  }

  return await response.json()
}

// Récupérer les cours publics

// Récupérer les groupes d'un cours
export const getCourseGroups = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/groups/course/${courseId}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération groupes')
    return await response.json()
  } catch (error) {
    console.error('Erreur getCourseGroups:', error)
    throw error
  }
}

// src/services/api.js - AJOUTEZ CES FONCTIONS À VOTRE FICHIER API EXISTANT

// ===== PARENT ROUTES =====

/**
 * Récupérer tous les enfants d'un parent
 */
export const getParentChildren = async () => {
  try {
    const response = await fetch(`${API_URL}/parents/children`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération enfants')
    return await response.json()
  } catch (error) {
    console.error('Erreur getParentChildren:', error)
    throw error
  }
}

/**
 * Récupérer les cours d'un enfant spécifique
 */
export const getChildCourses = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/parents/children/${studentId}/courses`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération cours enfant')
    return await response.json()
  } catch (error) {
    console.error('Erreur getChildCourses:', error)
    throw error
  }
}

/**
 * Vérifier si un email étudiant existe
 */
export const checkStudentEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/parents/check-student/${email}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur vérification email')
    return await response.json()
  } catch (error) {
    console.error('Erreur checkStudentEmail:', error)
    throw error
  }
}

/**
 * Créer un nouvel enfant et le lier au parent
 */
export const registerChild = async (childData) => {
  try {
    const response = await fetch(`${API_URL}/parents/register-child`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(childData),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur création enfant')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur registerChild:', error)
    throw error
  }
}

/**
 * Lier un enfant existant au parent
 */
export const linkExistingChild = async (studentEmail) => {
  try {
    const response = await fetch(`${API_URL}/parents/link-child`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ student_email: studentEmail }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur liaison enfant')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur linkExistingChild:', error)
    throw error
  }
}

/**
 * Inscrire un enfant à un groupe de cours
 */
export const enrollChild = async (studentId, groupId) => {
  try {
    const response = await fetch(`${API_URL}/parents/enroll-child`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ student_id: studentId, group_id: groupId }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur inscription enfant')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur enrollChild:', error)
    throw error
  }
}

/**
 * Retirer un enfant d'un cours
 */
export const unenrollChild = async (studentId, enrollmentId) => {
  try {
    const response = await fetch(
      `${API_URL}/parents/children/${studentId}/enrollments/${enrollmentId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      },
    )
    if (!response.ok) throw new Error('Erreur annulation inscription')
    return await response.json()
  } catch (error) {
    console.error('Erreur unenrollChild:', error)
    throw error
  }
}

/**
 * Délier un enfant du parent
 */
export const unlinkChild = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/parents/unlink-child/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur suppression enfant')
    return await response.json()
  } catch (error) {
    console.error('Erreur unlinkChild:', error)
    throw error
  }
}

// ============= STUDENT ROUTES =============

/**
 * Get student's own enrolled courses
 */
export const getStudentCourses = async () => {
  try {
    const response = await fetch(`${API_URL}/students/my-courses`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération cours étudiant')
    return await response.json()
  } catch (error) {
    console.error('Erreur getStudentCourses:', error)
    throw error
  }
}

/**
 * Get student's enrolled groups
 */
export const getStudentGroups = async () => {
  try {
    const response = await fetch(`${API_URL}/students/my-groups`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération groupes étudiant')
    return await response.json()
  } catch (error) {
    console.error('Erreur getStudentGroups:', error)
    throw error
  }
}

// ============================================
// GROUPES - FONCTIONS MISES À JOUR
// ============================================

/**
 * Récupérer les étudiants d'un groupe (avec notes et paiements)
 */
export const getGroupStudents = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération étudiants')
    return await response.json()
  } catch (error) {
    console.error('Erreur getGroupStudents:', error)
    throw error
  }
}

/**
 * Ajouter un étudiant au groupe (avec auto-création si besoin)
 */
export const addStudentToGroup = async (groupId, studentData) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur ajout étudiant')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur addStudentToGroup:', error)
    throw error
  }
}

/**
 * Retirer un étudiant du groupe
 */
export const removeStudentFromGroup = async (groupId, studentId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur retrait étudiant')
    return await response.json()
  } catch (error) {
    console.error('Erreur removeStudentFromGroup:', error)
    throw error
  }
}

/**
 * Mettre à jour le paiement d'un étudiant
 */
export const updateStudentPayment = async (groupId, studentId, paymentData) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students/${studentId}/payment`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(paymentData),
    })
    if (!response.ok) throw new Error('Erreur mise à jour paiement')
    return await response.json()
  } catch (error) {
    console.error('Erreur updateStudentPayment:', error)
    throw error
  }
}

/**
 * Récupérer la liste des étudiants disponibles
 */
export const getAvailableStudents = async () => {
  try {
    const response = await fetch(`${API_URL}/groups/students/available`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération étudiants disponibles')
    return await response.json()
  } catch (error) {
    console.error('Erreur getAvailableStudents:', error)
    throw error
  }
}

// ============================================
// NOTES/REMARQUES
// ============================================

/**
 * Récupérer les notes d'un étudiant dans un groupe
 */
export const getStudentNotes = async (groupId, studentId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students/${studentId}/notes`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération notes')
    return await response.json()
  } catch (error) {
    console.error('Erreur getStudentNotes:', error)
    throw error
  }
}

/**
 * Ajouter une note/remarque à un étudiant
 */
export const addStudentNote = async (groupId, studentId, noteData) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/students/${studentId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(noteData),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur ajout note')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur addStudentNote:', error)
    throw error
  }
}

/**
 * Supprimer une note
 */
export const deleteStudentNote = async (groupId, studentId, noteId) => {
  try {
    const response = await fetch(
      `${API_URL}/groups/${groupId}/students/${studentId}/notes/${noteId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      },
    )
    if (!response.ok) throw new Error('Erreur suppression note')
    return await response.json()
  } catch (error) {
    console.error('Erreur deleteStudentNote:', error)
    throw error
  }
}

// ============================================
// CALENDRIER / SESSIONS
// ============================================

/**
 * Récupérer le calendrier d'un groupe
 */
export const getGroupCalendar = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/calendar`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération calendrier')
    return await response.json()
  } catch (error) {
    console.error('Erreur getGroupCalendar:', error)
    throw error
  }
}

/**
 * Créer/Remplacer le calendrier d'un groupe
 */
export const createGroupCalendar = async (groupId, sessions) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/calendar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessions }),
    })
    if (!response.ok) throw new Error('Erreur création calendrier')
    return await response.json()
  } catch (error) {
    console.error('Erreur createGroupCalendar:', error)
    throw error
  }
}

/**
 * Modifier une session
 */
export const modifySession = async (sessionId, sessionData) => {
  try {
    const response = await fetch(`${API_URL}/groups/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(sessionData),
    })
    if (!response.ok) throw new Error('Erreur modification session')
    return await response.json()
  } catch (error) {
    console.error('Erreur modifySession:', error)
    throw error
  }
}

/**
 * Annuler une session
 */
export const cancelSession = async (sessionId, reason) => {
  try {
    const response = await fetch(`${API_URL}/groups/sessions/${sessionId}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) throw new Error('Erreur annulation session')
    return await response.json()
  } catch (error) {
    console.error('Erreur cancelSession:', error)
    throw error
  }
}

// ============================================
// FONCTIONS EXISTANTES À GARDER/MODIFIER
// ============================================

/**
 * Créer un groupe (mis à jour pour supporter le calendrier flexible)
 */
export const createGroup = async (groupData) => {
  try {
    const response = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(groupData),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur création groupe')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur createGroup:', error)
    throw error
  }
}

/**
 * Modifier un groupe
 */
export const updateGroup = async (groupId, groupData) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(groupData),
    })
    if (!response.ok) throw new Error('Erreur modification groupe')
    return await response.json()
  } catch (error) {
    console.error('Erreur updateGroup:', error)
    throw error
  }
}

/**
 * Supprimer un groupe
 */
export const deleteGroup = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur suppression groupe')
    return await response.json()
  } catch (error) {
    console.error('Erreur deleteGroup:', error)
    throw error
  }
}

/**
 * Récupérer les groupes d'un cours
 */
export const getGroupsByCourse = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/groups/course/${courseId}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération groupes')
    return await response.json()
  } catch (error) {
    console.error('Erreur getGroupsByCourse:', error)
    throw error
  }
}

/**
 * Récupérer un groupe spécifique
 */
export const getGroup = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur récupération groupe')
    return await response.json()
  } catch (error) {
    console.error('Erreur getGroup:', error)
    throw error
  }
}

/**
 * Ouvrir/Fermer les inscriptions
 */
export const toggleGroupRegistration = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/toggle-registration`, {
      method: 'PATCH',
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Erreur toggle registration')
    return await response.json()
  } catch (error) {
    console.error('Erreur toggleGroupRegistration:', error)
    throw error
  }
}

// ============================================
// GESTION DES SÉANCES
// ============================================

/**
 * Mettre à jour la configuration des séances d'un groupe
 */
export const updateSessionsConfig = async (groupId, config) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/sessions-config`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(config),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur mise à jour config séances')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur updateSessionsConfig:', error)
    throw error
  }
}

/**
 * Mettre à jour le nombre maximum d'étudiants
 */
export const updateMaxStudents = async (groupId, maxStudents) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/max-students`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ max_students: maxStudents }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur mise à jour max étudiants')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur updateMaxStudents:', error)
    throw error
  }
}

/**
 * Mettre à jour toutes les sessions d'un groupe
 */
export const updateGroupSessions = async (groupId, sessions) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/sessions`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ sessions }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur mise à jour sessions')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur updateGroupSessions:', error)
    throw error
  }
}

// ============================================
// GESTION DES CYCLES MODIFIÉS
// ============================================

/**
 * Enregistrer les modifications du prochain cycle
 */
export const saveNextCycleModifications = async (groupId, modifications) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/next-cycle-modifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(modifications),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur enregistrement modifications cycle')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur saveNextCycleModifications:', error)
    throw error
  }
}

/**
 * Appliquer les modifications du prochain cycle maintenant
 */
export const applyNextCycle = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/apply-next-cycle`, {
      method: 'POST',
      headers: getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur application cycle')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur applyNextCycle:', error)
    throw error
  }
}

/**
 * Annuler les modifications du prochain cycle
 */
export const cancelNextCycleModifications = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/next-cycle-modifications`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur annulation modifications')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur cancelNextCycleModifications:', error)
    throw error
  }
}

/**
 * Retourner au cycle normal
 */
export const returnToNormalCycle = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/return-to-normal`, {
      method: 'POST',
      headers: getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur retour cycle normal')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur returnToNormalCycle:', error)
    throw error
  }
}

/**
 * Obtenir les informations complètes sur les cycles d'un groupe
 */
export const getGroupCycleInfo = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/cycle-info`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur récupération info cycle')
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur getGroupCycleInfo:', error)
    throw error
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Calculer automatiquement le nombre de séances selon les semaines et fréquence
 */
export const calculateTotalSessions = (totalWeeks, sessionsPerWeek) => {
  return totalWeeks * sessionsPerWeek
}

/**
 * Générer un template de sessions basé sur le nombre de semaines et séances
 */
export const generateSessionsTemplate = (
  totalWeeks,
  sessionsPerWeek,
  baseTime = { start: '09:00', end: '11:00' },
) => {
  const sessions = []
  let sessionNumber = 1

  for (let week = 1; week <= totalWeeks; week++) {
    for (let sessionInWeek = 1; sessionInWeek <= sessionsPerWeek; sessionInWeek++) {
      sessions.push({
        session_number: sessionNumber,
        week: week,
        title: `Séance ${sessionNumber}`,
        date: '', // À remplir
        start_time: baseTime.start,
        end_time: baseTime.end,
        status: 'scheduled',
      })
      sessionNumber++
    }
  }

  return sessions
}

/**
 * Valider les données de sessions
 */
export const validateSessions = (sessions, totalSessions) => {
  const errors = []

  if (!Array.isArray(sessions)) {
    errors.push('Les sessions doivent être un tableau')
    return { valid: false, errors }
  }

  if (sessions.length !== totalSessions) {
    errors.push(`Nombre de séances incorrect: ${sessions.length} au lieu de ${totalSessions}`)
  }

  const sessionNumbers = sessions.map((s) => s.session_number)
  const uniqueNumbers = new Set(sessionNumbers)

  if (uniqueNumbers.size !== sessionNumbers.length) {
    errors.push('Numéros de séances dupliqués détectés')
  }

  sessions.forEach((session, index) => {
    if (!session.session_number) {
      errors.push(`Séance ${index + 1}: session_number manquant`)
    }
    if (!session.start_time) {
      errors.push(`Séance ${session.session_number}: start_time manquant`)
    }
    if (!session.end_time) {
      errors.push(`Séance ${session.session_number}: end_time manquant`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Obtenir les semaines d'un cycle avec leurs séances
 */
export const groupSessionsByWeek = (sessions) => {
  const weeks = {}

  sessions.forEach((session) => {
    const week = session.week || 1
    if (!weeks[week]) {
      weeks[week] = []
    }
    weeks[week].push(session)
  })

  return weeks
}

// src/services/api.js
// Ajouter ces fonctions à la fin du fichier api.js

// ==========================================
// NOUVELLES FONCTIONS - GESTION UTILISATEURS
// ==========================================

// Get all teachers (admin)
export const getAllTeachers = async () => {
  const response = await fetch(`${API_URL}/users/teachers`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch teachers')
  }

  return response.json()
}

// Delete user (admin)
export const deleteUser = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete user')
  }

  return response.json()
}

// Get stats (admin)
export const getStats = async () => {
  const response = await fetch(`${API_URL}/stats`, {
    // ✅ FIXED URL
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch stats')
  }

  return response.json()
}
// =============================================
// STEP 5: FRONTEND API SERVICE
// Add these functions to: src/services/api.js
// =============================================

// ⭐ ADD THIS TO THE END OF YOUR api.js FILE

// =============================================
// COURSE MATERIALS API
// =============================================

export const uploadMaterial = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/materials/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        // Do NOT set Content-Type - browser will set it with boundary
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur téléchargement')
    }

    return await response.json()
  } catch (error) {
    console.error('Upload material error:', error)
    throw error
  }
}

export const getCourseMaterials = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/materials/course/${courseId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur récupération matériaux')
    }

    return await response.json()
  } catch (error) {
    console.error('Get materials error:', error)
    throw error
  }
}

export const downloadMaterial = (materialId) => {
  return `${API_URL}/materials/download/${materialId}`
}

export const deleteMaterial = async (materialId) => {
  try {
    const response = await fetch(`${API_URL}/materials/${materialId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur suppression')
    }

    return await response.json()
  } catch (error) {
    console.error('Delete material error:', error)
    throw error
  }
}
// Add this function to your src/services/api.js file

// ============= CALENDAR =============

export const getCalendarEvents = async (role) => {
  let endpoint = '/calendar/student' // default

  if (role === 'admin') {
    endpoint = '/calendar/admin'
  } else if (role === 'teacher') {
    endpoint = '/calendar/teacher'
  } else if (role === 'Parent') {
    endpoint = '/calendar/parent'
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du calendrier')
  }

  return await response.json()
}

// ============= NOTIFICATIONS =============

export const getUpcomingNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications/upcoming`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Erreur notifications')
  return response.json()
}

export const getAllStudents = async () => {
  const response = await fetch(`${API_URL}/users/students`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch students')
  }
  return response.json()
}

// ============= ADMIN USER MANAGEMENT =============

// Liste des enseignants (admin)
export const getAdminTeachersList = async () => {
  const response = await fetch(`${API_URL}/auth/users/teachers`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur récupération enseignants')
  }
  return response.json()
}

// Liste des étudiants (admin)
export const getAdminStudentsList = async () => {
  const response = await fetch(`${API_URL}/auth/users/students`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur récupération étudiants')
  }
  return response.json()
}

// Supprimer un utilisateur (admin) — supprime tout en cascade
export const adminDeleteUser = async (userId) => {
  const response = await fetch(`${API_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur suppression')
  }
  return response.json()
}

// frontend/src/services/api.js

// Nettoyer les étudiants inactifs (0 cours + 60 jours)
export const adminCleanupInactiveStudents = async () => {
  const response = await fetch(`${API_URL}/auth/users/cleanup/inactive-students`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors du nettoyage')
  }
  return response.json()
}

// ============= NOTIFICATIONS =============

export const getNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Erreur de récupération des notifications')
  return response.json()
}

export const markNotificationsAsRead = async () => {
  await fetch(`${API_URL}/notifications/mark-read`, { method: 'POST', headers: getHeaders() })
}

export const deleteNotificationApi = async (notifId) => {
  const response = await fetch(`${API_URL}/notifications/${notifId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Erreur de suppression')
  return response.json()
}

// ✅ FIX: This function was imported in useNotifications.js but was MISSING from api.js
export const clearAllNotificationsApi = async () => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Erreur suppression de toutes les notifications')
  return response.json()
}

// Set / reset a teacher's password (admin only)
export const setTeacherPassword = async (teacherId, newPassword) => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/auth/teacher/${teacherId}/set-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ new_password: newPassword }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.error)
  }
  return res.json()
}

// Admin changes their own password

// Change own password (works for any role: teacher, admin...)
export const changeMyPassword = async (oldPassword, newPassword) => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/auth/change-my-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.error)
  }
  return res.json()
}
// ============= ENSEIGNANTS =============

export const registerTeacher = async (teacherData) => {
  const response = await fetch(`${API_URL}/auth/register-teacher`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(teacherData),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur création enseignant')
  }
  return await response.json()
}
// Add to src/services/api.js

export const getStudentProfile = async () => {
  const response = await fetch(`${API_URL}/students/profile`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Erreur récupération profil')
  return await response.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE : src/services/api_ticket_additions.js
//
// INSTRUCTIONS
// ─────────────
// In your existing src/services/api.js:
//
//  1. REPLACE the old `scanStudentInGroup` function (GET → POST).
//  2. ADD the three new exports below it.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── [REPLACE] scanStudentInGroup ────────────────────────────────────────────
// Changed from GET → POST because the backend now increments the session counter
// as a side effect of scanning.
export const scanStudentInGroup = async (groupId, studentId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/scan/${studentId}`, {
    method: 'POST', // ← was GET
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur scan')
  }
  return await response.json()
}

// ─── [NEW] markStudentPaid ───────────────────────────────────────────────────
// Admin action: marks a student as paid and resets their session counter to 0.
export const markStudentPaid = async (groupId, studentId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/students/${studentId}/mark-paid`, {
    method: 'PATCH',
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors du marquage payé')
  }
  return await response.json()
}

// ─── [NEW] getAbsentStudentsToday ────────────────────────────────────────────
// Returns all active students in a group who have NOT been scanned today.
export const getAbsentStudentsToday = async (groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/absent-today`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur récupération absents')
  }
  return await response.json()
}

// ─── [NEW] bulkRemoveStudents ────────────────────────────────────────────────
// Permanently removes multiple students from a group in one request.
// studentIds: number[]
export const bulkRemoveStudents = async (groupId, studentIds) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/bulk-remove-students`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ student_ids: studentIds }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur suppression en lot')
  }
  return await response.json()
}
export const searchStudents = async (q) => {
  const response = await fetch(`${API_URL}/stats/search-students?q=${encodeURIComponent(q)}`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur recherche étudiants')
  }
  return response.json()
}

export const getStudentHistory = async (studentId) => {
  const response = await fetch(`${API_URL}/stats/student-history/${studentId}`, {
    headers: getHeaders(),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Erreur récupération de l'historique")
  }
  return response.json()
}
