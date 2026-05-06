//
//  APIClient.swift
//  WriteScholar
//
//  Thin async/await wrapper around URLSession. Handles JSON encoding,
//  decoding, optional auth header, and consistent error mapping so the
//  rest of the app speaks `WSResult<T>` instead of raw URLResponses.
//

import Foundation

// MARK: - Errors

enum APIError: LocalizedError {
    case badStatus(code: Int, message: String)
    case decodingFailed(Error)
    case transport(Error)
    case unauthorized
    case noData

    var errorDescription: String? {
        switch self {
        case .badStatus(_, let msg): return msg
        case .decodingFailed:        return "Couldn't read the server response."
        case .transport(let e):      return e.localizedDescription
        case .unauthorized:          return "Your session expired. Please log in again."
        case .noData:                return "Empty server response."
        }
    }
}

// MARK: - Standard server envelope

/// All WriteScholar endpoints return `{ success: Bool, message: String?, data: T }`.
struct APIEnvelope<T: Decodable>: Decodable {
    let success: Bool
    let message: String?
    let data: T?
}

/// Empty type for envelopes whose data we don't care about.
struct APIEmpty: Decodable {}

// MARK: - Client

final class APIClient: @unchecked Sendable {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    /// Auth token reads from the Keychain on each request, so token
    /// rotation in another part of the app is picked up immediately.
    private var authTokenProvider: () -> String? = { KeychainStore.shared.authToken }

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .useDefaultKeys
        self.encoder = JSONEncoder()
    }

    // MARK: Public

    /// POST a JSON body and decode the envelope's `data` field as `T`.
    func post<Body: Encodable, T: Decodable>(
        path: String,
        body: Body,
        requiresAuth: Bool = false
    ) async throws -> T {
        let request = try makeRequest(path: path, method: "POST", body: body, requiresAuth: requiresAuth)
        return try await perform(request)
    }

    /// GET an endpoint and decode the envelope's `data` field as `T`.
    func get<T: Decodable>(path: String, requiresAuth: Bool = false) async throws -> T {
        let request = try makeRequest(path: path, method: "GET", body: Optional<Empty>.none, requiresAuth: requiresAuth)
        return try await perform(request)
    }

    // MARK: Internal helpers

    private struct Empty: Encodable {}

    private func makeRequest<Body: Encodable>(
        path: String,
        method: String,
        body: Body?,
        requiresAuth: Bool
    ) throws -> URLRequest {
        let url = APIConfig.baseURL.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body = body {
            req.httpBody = try encoder.encode(body)
        }
        if requiresAuth, let token = authTokenProvider() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return req
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.noData
        }

        if http.statusCode == 401 {
            throw APIError.unauthorized
        }

        // Try to decode as the standard envelope first so we can surface
        // the server's `message` even on non-2xx responses.
        let envelope: APIEnvelope<T>
        do {
            envelope = try decoder.decode(APIEnvelope<T>.self, from: data)
        } catch {
            // Some endpoints return raw payloads (rare). Surface as decoding failure.
            throw APIError.decodingFailed(error)
        }

        guard (200...299).contains(http.statusCode), envelope.success else {
            throw APIError.badStatus(
                code: http.statusCode,
                message: envelope.message ?? "Request failed (HTTP \(http.statusCode))."
            )
        }

        guard let payload = envelope.data else {
            throw APIError.noData
        }
        return payload
    }
}
