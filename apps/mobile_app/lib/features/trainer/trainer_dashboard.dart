
import 'package:material_ui/material_ui.dart';

class TrainerDashboard extends StatelessWidget {
  final String userName;
  final VoidCallback onLogout;

  const TrainerDashboard({
    super.key,
    required this.userName,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MusclesMaster Trainer'),
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
              'Manage your training activities.',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 24),

            _buildDashboardCard(
              icon: Icons.people_outline,
              title: 'My Members',
              subtitle: 'View your assigned members',
            ),

            const SizedBox(height: 16),

            _buildDashboardCard(
              icon: Icons.fitness_center,
              title: 'Workout Plans',
              subtitle: 'Manage member workout plans',
            ),

            const SizedBox(height: 16),

            _buildDashboardCard(
              icon: Icons.calendar_month,
              title: 'My Schedule',
              subtitle: 'View your training schedule',
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
