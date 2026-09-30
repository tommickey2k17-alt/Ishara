/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClinicalTriState, SleepQuality, SymptomFrequency } from '../types';

/**
 * Converts clinical frequency enums into plain, natural language for patients.
 * Example: 'intermittent' -> 'Comes and goes'
 */
export function formatSymptomFrequency(freq?: SymptomFrequency | string): string {
  switch (freq) {
    case 'intermittent':
      return 'Comes and goes';
    case 'constant':
      return 'Stays the whole time';
    case 'fluctuating':
      return 'Goes up and down';
    case 'single_episode':
      return 'Happened once';
    default:
      return freq ? String(freq) : 'Not recorded';
  }
}

/**
 * Converts sleep quality into natural language with clear descriptions.
 */
export function formatSleepQuality(quality?: SleepQuality | string): string {
  switch (quality) {
    case 'excellent':
      return 'Restful & deep';
    case 'good':
      return 'Good rest';
    case 'okay':
      return 'Fair rest';
    case 'poor':
      return 'Broken or restless';
    default:
      return 'Not recorded';
  }
}

/**
 * Converts tri-state clinical question responses into plain conversational phrases.
 */
export function formatTriStateResponse(
  state?: ClinicalTriState,
  question: 'fever' | 'prior' | 'evaluated' | 'worsening' = 'fever'
): string {
  if (state === 'yes') {
    switch (question) {
      case 'fever':
        return 'Had a fever';
      case 'prior':
        return 'Had this before';
      case 'evaluated':
        return 'Checked by a doctor';
      case 'worsening':
        return 'Getting worse';
    }
  }
  if (state === 'no') {
    switch (question) {
      case 'fever':
        return 'No fever';
      case 'prior':
        return 'First time feeling this';
      case 'evaluated':
        return 'Not checked by a doctor';
      case 'worsening':
        return 'Not getting worse';
    }
  }
  return 'Not recorded';
}
