import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                CaptureView()
            }
            .tabItem {
                Label("残す", systemImage: "square.and.pencil")
            }

            NavigationStack {
                ThoughtListView()
            }
            .tabItem {
                Label("振り返る", systemImage: "text.book.closed")
            }
        }
        .tint(.accentColor)
    }
}

#Preview {
    RootView()
        .modelContainer(for: ThoughtEntry.self, inMemory: true)
}
