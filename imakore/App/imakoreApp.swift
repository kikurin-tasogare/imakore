import SwiftData
import SwiftUI

@main
struct imakoreApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: ThoughtEntry.self)
    }
}
