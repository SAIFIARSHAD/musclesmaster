import 'package:material_ui/material_ui.dart';

class TrainerDashboard extends StatelessWidget {
  final String userName;
  final String branchName;
  final String branchId;
  final VoidCallback onLogout;

  const TrainerDashboard({
    super.key,
    required this.userName,
    required this.onLogout,
    this.branchName = 'Branch not assigned',
    this.branchId = 'N/A',
  });

  static const Color _navy = Color(0xFF07111D);
  static const Color _navyLight = Color(0xFF102438);
  static const Color _orange = Color(0xFFF4510B);
  static const Color _orangeLight = Color(0xFFFF762D);
  static const Color _textMuted = Color(0xFFADB9C8);
  static const Color _cardBorder = Color(0xFF26394B);

  String get _firstName {
    final name = userName.trim();
    if (name.isEmpty) return 'Trainer';
    return name.split(' ').first;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _navy,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTopBar(context),
              _buildHero(),
              _buildBranchCard(),
              const SizedBox(height: 18),
              _buildOverview(context),
              const SizedBox(height: 24),
              _buildWorkspace(context),
              const SizedBox(height: 24),
              _buildQuickActions(context),
              const SizedBox(height: 20),
              _buildCoachingCard(context),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigation(context),
    );
  }

  // ---------------------------------------------------------
  // TOP BAR
  // ---------------------------------------------------------

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
      child: Row(
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: _orange,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.fitness_center_rounded,
              color: Colors.white,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'MusclesMaster AI',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: 19,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.4,
              ),
            ),
          ),
          IconButton(
            onPressed: () => _showMessage(context, 'Notifications'),
            icon: const Icon(
              Icons.notifications_none_rounded,
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: onLogout,
            borderRadius: BorderRadius.circular(30),
            child: Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: _navyLight,
                shape: BoxShape.circle,
                border: Border.all(
                  color: _orange,
                  width: 1.5,
                ),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Colors.white,
                size: 25,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // HERO
  // ---------------------------------------------------------

  Widget _buildHero() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
      child: Stack(
        children: [
          Positioned(
            right: -25,
            top: 0,
            bottom: 0,
            child: Container(
              width: 190,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _navy.withValues(alpha: 0),
                    _orange.withValues(alpha: 0.20),
                    _orange.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          Positioned(
            right: 5,
            top: 5,
            child: Icon(
              Icons.fitness_center_rounded,
              size: 135,
              color: Colors.white.withValues(alpha: 0.055),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back, Trainer',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.90),
                  fontSize: 21,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                '$_firstName!',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _orangeLight,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.7,
                ),
              ),
              const SizedBox(height: 10),
              const SizedBox(
                width: 250,
                child: Text(
                  'Help your members reach their goals. Keep motivating, keep growing.',
                  style: TextStyle(
                    color: _textMuted,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              Container(
                height: 4,
                width: 105,
                decoration: BoxDecoration(
                  color: _orange,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // BRANCH CARD
  // ---------------------------------------------------------

  Widget _buildBranchCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _navyLight.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: _orange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(
              Icons.location_on_rounded,
              color: _orangeLight,
              size: 29,
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  branchName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Branch ID: $branchId',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            color: _orangeLight,
            size: 16,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // OVERVIEW
  // ---------------------------------------------------------

  Widget _buildOverview(BuildContext context) {
    return SizedBox(
      height: 112,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          _buildOverviewCard(
            icon: Icons.groups_rounded,
            title: 'My Members',
            subtitle: 'Manage members',
            color: const Color(0xFF8B5CF6),
            onTap: () => _showMessage(context, 'My Members'),
          ),
          _buildOverviewCard(
            icon: Icons.fitness_center_rounded,
            title: 'Workout Plans',
            subtitle: 'Manage plans',
            color: _orangeLight,
            onTap: () => _showMessage(context, 'Workout Plans'),
          ),
          _buildOverviewCard(
            icon: Icons.calendar_month_rounded,
            title: 'My Schedule',
            subtitle: 'View sessions',
            color: const Color(0xFF22B8CF),
            onTap: () => _showMessage(context, 'My Schedule'),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 145,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _navyLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 27),
            const Spacer(),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: _textMuted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // TRAINER WORKSPACE
  // ---------------------------------------------------------

  Widget _buildWorkspace(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text(
                'Trainer Workspace',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Spacer(),
              Icon(
                Icons.dashboard_customize_rounded,
                color: _orangeLight,
                size: 23,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 4,
            width: 82,
            decoration: BoxDecoration(
              color: _orange,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 17),
          Row(
            children: [
              Expanded(
                child: _buildWorkspaceTile(
                  context,
                  icon: Icons.groups_rounded,
                  title: 'My Members',
                  subtitle: 'View & manage your assigned members',
                  color: const Color(0xFF8B5CF6),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildWorkspaceTile(
                  context,
                  icon: Icons.fitness_center_rounded,
                  title: 'Workout Plans',
                  subtitle: 'Create & manage workout plans',
                  color: _orangeLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildWorkspaceTile(
                  context,
                  icon: Icons.calendar_month_rounded,
                  title: 'My Schedule',
                  subtitle: 'View your training schedule',
                  color: const Color(0xFF22B8CF),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildWorkspaceTile(
                  context,
                  icon: Icons.fact_check_rounded,
                  title: 'Attendance',
                  subtitle: 'Track member check-in & check-out',
                  color: const Color(0xFF34D399),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWorkspaceTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
  }) {
    return InkWell(
      onTap: () => _showMessage(context, title),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        height: 158,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _navyLight.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 43,
              width: 43,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Text(
                subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _textMuted,
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ),
            const Align(
              alignment: Alignment.bottomRight,
              child: Icon(
                Icons.arrow_forward_rounded,
                color: _orangeLight,
                size: 19,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // QUICK ACTIONS
  // ---------------------------------------------------------

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      (
        icon: Icons.person_add_alt_1_rounded,
        title: 'Members',
      ),
      (
        icon: Icons.add_task_rounded,
        title: 'Create Plan',
      ),
      (
        icon: Icons.event_available_rounded,
        title: 'Schedule',
      ),
      (
        icon: Icons.fact_check_rounded,
        title: 'Attendance',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.bolt_rounded,
                color: _orangeLight,
                size: 25,
              ),
              SizedBox(width: 8),
              Text(
                'Quick Actions',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: actions.map((action) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    onTap: () => _showMessage(
                      context,
                      action.title,
                    ),
                    borderRadius: BorderRadius.circular(17),
                    child: Container(
                      height: 100,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: _navyLight,
                        borderRadius: BorderRadius.circular(17),
                        border: Border.all(color: _cardBorder),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            action.icon,
                            color: _orangeLight,
                            size: 27,
                          ),
                          const SizedBox(height: 9),
                          Text(
                            action.title,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // COACHING CARD
  // ---------------------------------------------------------

  Widget _buildCoachingCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF172A3D),
            Color(0xFF0B1927),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Container(
            height: 54,
            width: 54,
            decoration: BoxDecoration(
              color: _orange.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.emoji_events_rounded,
              color: _orangeLight,
              size: 30,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Coaching Journey',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Stay consistent and help your members progress.',
                  style: TextStyle(
                    color: _textMuted,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_rounded,
            color: _orangeLight,
            size: 22,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // BOTTOM NAVIGATION
  // ---------------------------------------------------------

  Widget _buildBottomNavigation(BuildContext context) {
    final items = [
      (icon: Icons.home_rounded, title: 'Home'),
      (icon: Icons.groups_rounded, title: 'Members'),
      (icon: Icons.fitness_center_rounded, title: 'Workouts'),
      (icon: Icons.calendar_month_rounded, title: 'Schedule'),
      (icon: Icons.person_outline_rounded, title: 'Profile'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B1B2A),
        border: Border(
          top: BorderSide(
            color: _cardBorder.withValues(alpha: 0.8),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
          child: Row(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final selected = index == 0;

              return Expanded(
                child: InkWell(
                  onTap: selected
                      ? null
                      : () => _showMessage(context, item.title),
                  borderRadius: BorderRadius.circular(14),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          color: selected
                              ? _orangeLight
                              : _textMuted,
                          size: 23,
                        ),
                        const SizedBox(height: 5),
                        Text(
                          item.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: selected
                                ? _orangeLight
                                : _textMuted,
                            fontSize: 9,
                            fontWeight: selected
                                ? FontWeight.w800
                                : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Container(
                          height: 3,
                          width: selected ? 32 : 0,
                          decoration: BoxDecoration(
                            color: _orange,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // MESSAGE HELPER
  // ---------------------------------------------------------

  void _showMessage(BuildContext context, String section) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$section section will be connected here.'),
        backgroundColor: _navyLight,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
