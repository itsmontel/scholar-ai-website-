//
//  AnalyzeAPI.swift
//  WriteScholar
//
//  Endpoint helpers for the essay analysis flow. Posts pasted content
//  to /api/analysis/analyze; the backend creates a Document row server-
//  side automatically when only `content` is supplied.
//

import Foundation

enum AnalyzeAPI {
    enum AnalysisType: String, Encodable {
        case comprehensive
        case citationReview = "citation_review"
    }

    enum GradingStyle: String, Encodable, CaseIterable, Identifiable {
        case us
        case uk
        var id: Self { self }

        var label: String {
            switch self {
            case .us: return "US (high school / college)"
            case .uk: return "UK / international"
            }
        }
    }

    struct AnalyzeRequest: Encodable {
        let content: String
        let analysisType: AnalysisType
        let gradingStyle: GradingStyle
        let citationStyle: String?

        enum CodingKeys: String, CodingKey {
            case content
            case analysisType
            case gradingStyle
            case citationStyle
        }
    }

    /// Comprehensive analysis on pasted text. The backend creates a
    /// Document automatically so the analysis lands in /history later.
    static func analyze(
        text: String,
        gradingStyle: GradingStyle = .us
    ) async throws -> AnalysisResult {
        try await APIClient.shared.post(
            path: "analysis/analyze",
            body: AnalyzeRequest(
                content: text,
                analysisType: .comprehensive,
                gradingStyle: gradingStyle,
                citationStyle: nil
            ),
            requiresAuth: true
        )
    }
}
