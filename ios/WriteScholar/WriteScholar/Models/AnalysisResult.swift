//
//  AnalysisResult.swift
//  WriteScholar
//
//  Mirrors the JSON returned by POST /api/analysis/analyze. Free users
//  see `gradeRubric` and `specificRewrites` as `nil`; the UI renders a
//  Pro lock pane in those cases.
//

import Foundation
import SwiftUI

// MARK: - Top-level

struct AnalysisResult: Decodable {
    /// The full markdown summary the LLM produced.
    let result: String?
    /// Inline annotations with character ranges into the original content.
    let annotations: [Annotation]?
    /// 0–100 quality score (or null for citation review).
    let overallScore: Double?
    /// Letter grade or short label ("B+", "Strong", etc).
    let gradeEstimate: String?
    /// Free-form clarity label ("Clear", "Mixed", etc).
    let clarityRating: String?
    /// Top-N actionable suggestions.
    let topSuggestions: [String]?
    /// Per-criterion rubric breakdown — Pro only.
    let gradeRubric: [String: RubricCriterion]?
    /// Specific rewrite candidates — Pro only.
    let specificRewrites: [SpecificRewrite]?
    /// Names of features the current plan can't see.
    let lockedFeatures: [String]?
    /// Whether the analyzer truncated the input.
    let isContentLimited: Bool?
    /// Backend's saved analysis row id, useful for sharing later.
    let savedAnalysisId: String?

    enum CodingKeys: String, CodingKey {
        case result, annotations
        case overallScore     = "overall_score"
        case gradeEstimate    = "grade_estimate"
        case clarityRating    = "clarity_rating"
        case topSuggestions   = "top_suggestions"
        case gradeRubric      = "grade_rubric"
        case specificRewrites = "specific_rewrites"
        case lockedFeatures
        case isContentLimited
        case savedAnalysisId
    }

    var sortedAnnotations: [Annotation] {
        (annotations ?? []).sorted { $0.startIndex < $1.startIndex }
    }
}

// MARK: - Annotation

struct Annotation: Decodable, Identifiable {
    let id: String
    let type: AnnotationType
    let text: String
    let startIndex: Int
    let endIndex: Int
    let comment: String
    let suggestion: String?
    let isCoverageOnly: Bool?

    enum AnnotationType: String, Decodable {
        case strong, improve, concern
    }

    /// Brand color for the chip + inline highlight.
    var tint: Color {
        switch type {
        case .strong:  return WSColor.strong
        case .improve: return WSColor.revise
        case .concern: return WSColor.concern
        }
    }

    /// SF Symbol used in the chip.
    var icon: String {
        switch type {
        case .strong:  return "checkmark.circle.fill"
        case .improve: return "exclamationmark.triangle.fill"
        case .concern: return "xmark.octagon.fill"
        }
    }

    var label: String {
        switch type {
        case .strong:  return "Strong"
        case .improve: return "Revise"
        case .concern: return "Concern"
        }
    }
}

// MARK: - Rubric

struct RubricCriterion: Decodable {
    let score: Double?
    let maxScore: Double?
    let feedback: String?

    enum CodingKeys: String, CodingKey {
        case score
        case maxScore = "max_score"
        case feedback
    }

    var fraction: Double {
        guard let s = score, let m = maxScore, m > 0 else { return 0 }
        return min(1.0, max(0.0, s / m))
    }
}

// MARK: - Specific rewrites (rare; Pro only)

struct SpecificRewrite: Decodable, Identifiable {
    let id: String
    let original: String?
    let rewrite: String?
    let reason: String?

    enum CodingKeys: String, CodingKey { case original, rewrite, reason }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        original = try? c.decode(String.self, forKey: .original)
        rewrite  = try? c.decode(String.self, forKey: .rewrite)
        reason   = try? c.decode(String.self, forKey: .reason)
        id = UUID().uuidString
    }
}
