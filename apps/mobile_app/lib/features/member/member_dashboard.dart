
import 'package:material_ui/material_ui.dart';

class MemberDashboard extends StatelessWidget {
  final String userName;
  final VoidCallback onLogout;

  const MemberDashboard({
    super.key,
    required this.userName,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MusclesMaster'),
        actions: [
          IconButton(
            onPressed: onLogout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, $userName!',
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your fitness journey starts here.',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 24),

            _buildDashboardCard(
              icon: Icons.card_membership,
              title: 'My Membership',
              subtitle: 'View your membership details',
            ),

            const SizedBox(height: 16),

            _buildDashboardCard(
              icon: Icons.fingerprint,
              title: 'Attendance',
              subtitle: 'Check your attendance history',
            ),

            const SizedBox(height: 16),

            _buildDashboardCard(
              icon: Icons.fitness_center,
              title: 'My Workouts',
              subtitle: 'View your workout plan',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardCard({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Card(
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF4F46E5)
              .withValues(alpha: 0.1),
          child: Icon(
            icon,
            color: const Color(0xFF4F46E5),
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
