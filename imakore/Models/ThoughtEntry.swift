import Foundation
import SwiftData

@Model
final class ThoughtEntry {
    var body: String
    var createdAt: Date
    var updatedAt: Date

    init(body: String, createdAt: Date = .now, updatedAt: Date? = nil) {
        self.body = body
        self.createdAt = createdAt
        self.updatedAt = updatedAt ?? createdAt
    }
}
