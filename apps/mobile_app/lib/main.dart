
import 'package:material_ui/material_ui.dart';
import 'package:dio/dio.dart';

import 'core/network/api_client.dart';
import 'features/member/member_dashboard.dart';
import 'features/trainer/trainer_dashboard.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const MusclesMasterApp());
}

class MusclesMasterApp extends StatelessWidget {
  const MusclesMasterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MusclesMaster AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _isCheckingAuth = true;

  String? _loggedInUser;
  String? _loggedInUserRole;
  String? _branchName;
  String? _branchId;
  String? _authCheckError;

  static const Color _navy = Color(0xFF07111D);
  static const Color _navyBlue = Color(0xFF101D2B);
  static const Color _orange = Color(0xFFF4510B);
  static const Color _lightOrange = Color(0xFFFF6A00);

  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  // CHECK EXISTING SESSION
  Future<void> _checkExistingSession() async {
    if (!mounted) return;

    setState(() {
      _isCheckingAuth = true;
      _authCheckError = null;
    });

    try {
      final token = await ApiClient.getAccessToken();

      // No saved token: show login screen
      if (token == null || token.isEmpty) {
        if (!mounted) return;

        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _branchName = null;
          _branchId = null;
          _isCheckingAuth = false;
        });

        return;
      }

      // Verify saved token with protected API
      final response = await ApiClient.dio.get(
        'auth/sessions',
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final savedUserName = await ApiClient.getUserName();
        final savedUserRole = await ApiClient.getUserRole();
        final branchDetails = _extractBranchDetails(response.data);

        if (!mounted) return;

        setState(() {
          _loggedInUser = savedUserName ?? 'User';
          _loggedInUserRole = savedUserRole?.toUpperCase();
          _branchName = branchDetails['name'];
          _branchId = branchDetails['id'];
          _isCheckingAuth = false;
        });
      } else {
        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _branchName = null;
          _branchId = null;
          _isCheckingAuth = false;
        });
      }
    } on DioException catch (error) {
      if (!mounted) return;

      final statusCode = error.response?.statusCode;

      if (statusCode == 401) {
        // Token is no longer accepted
        await ApiClient.clearAccessToken();
        await ApiClient.clearUserName();
        await ApiClient.clearUserRole();

        if (!mounted) return;

        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _authCheckError = null;
          _isCheckingAuth = false;
        });
      } else {
        // Network/server error: don't delete token
        setState(() {
          _authCheckError =
              'Unable to verify your session. Please try again.';
          _isCheckingAuth = false;
        });
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _authCheckError =
            'Something went wrong while checking your session.';
        _isCheckingAuth = false;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // EXTRACT BRANCH DETAILS FROM API RESPONSE
  Map<String, String> _extractBranchDetails(dynamic source) {
    if (source is! Map) {
      return {
        'name': 'Branch not assigned',
        'id': 'N/A',
      };
    }

    Map<String, dynamic> data = Map<String, dynamic>.from(source);

    // Handle common API response wrappers.
    if (data['data'] is Map) {
      data = Map<String, dynamic>.from(data['data'] as Map);
    }

    final userValue = data['user'];
    final user = userValue is Map
        ? Map<String, dynamic>.from(userValue)
        : data;

    final branchValue =
        user['branch'] ?? user['assignedBranch'] ?? data['branch'];

    final branch = branchValue is Map
        ? Map<String, dynamic>.from(branchValue)
        : <String, dynamic>{};

    final branchName = user['branchName'] ??
        user['branch_name'] ??
        branch['name'] ??
        branch['branchName'] ??
        branch['branch_name'] ??
        data['branchName'] ??
        data['branch_name'];

    final branchId = user['branchId'] ??
        user['branch_id'] ??
        branch['_id'] ??
        branch['id'] ??
        branch['branchId'] ??
        branch['branch_id'] ??
        data['branchId'] ??
        data['branch_id'];

    return {
      'name': branchName?.toString() ?? 'Branch not assigned',
      'id': branchId?.toString() ?? 'N/A',
    };
  }

  // LOGIN API
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiClient.dio.post(
        'auth/login',
        data: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        },
      );

      final responseData = response.data;
      debugPrint('LOGIN RESPONSE: ${response.data}');

      Map<String, dynamic>? payload;

      if (responseData is Map) {
        payload = Map<String, dynamic>.from(responseData);

        // Handle response wrapped inside "data"
        if (payload['data'] is Map) {
          payload = Map<String, dynamic>.from(
            payload['data'] as Map,
          );
        }
      }

      final token = payload?['accessToken'] ??
          payload?['access_token'] ??
          payload?['token'];

      if (token is! String || token.isEmpty) {
        throw Exception(
          'Login response received, but access token was not found.',
        );
      }

      // Save access token securely
      await ApiClient.saveAccessToken(token);

      final userData = payload?['user'];
      final branchDetails = _extractBranchDetails(userData ?? payload);
      final branchName = branchDetails['name'];
      final branchId = branchDetails['id'];

      String userName = 'User';

      if (userData is Map) {
        userName = userData['name']?.toString() ??
            userData['email']?.toString() ??
            'User';
      }

      await ApiClient.saveUserName(userName);

      // Get user's role from login response
      final userRole = userData is Map
          ? (
              userData['role'] ??
              userData['userRole']
            )?.toString().toUpperCase()
          : null;

      // Save user's role securely
      if (userRole != null && userRole.isNotEmpty) {
        await ApiClient.saveUserRole(userRole);
      } else {
        await ApiClient.clearUserRole();
      }

      if (!mounted) return;

      setState(() {
        _loggedInUser = userName;
        _loggedInUserRole = userRole;
        _branchName = branchName;
        _branchId = branchId;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login successful!'),
          backgroundColor: Colors.green,
        ),
      );
    } on DioException catch (error) {
      if (!mounted) return;

      final apiError = error.error;

      final message = apiError is ApiException
          ? apiError.message
          : error.message ?? 'Login failed. Please try again.';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
        ),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString()),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // LOGOUT
  Future<void> _logout() async {
    await ApiClient.clearAccessToken();
    await ApiClient.clearUserName();
    await ApiClient.clearUserRole();

    if (!mounted) return;

    setState(() {
      _loggedInUser = null;
      _loggedInUserRole = null;
      _branchName = null;
      _branchId = null;
      _passwordController.clear();
      _authCheckError = null;
    });
  }

  // ROLE-BASED DASHBOARD
  Widget _buildRoleDashboard() {
    final role = _loggedInUserRole?.toUpperCase();
    final userName = _loggedInUser ?? 'User';

    if (role == 'MEMBER') {
      return MemberDashboard(
        userName: userName,
        branchName: _branchName ?? 'Branch not assigned',
        branchId: _branchId ?? 'N/A',
        onLogout: _logout,
      );
    }

    if (role == 'TRAINER') {
      return TrainerDashboard(
        userName: userName,
        branchName: _branchName ?? 'Branch not assigned',
        branchId: _branchId ?? 'N/A', 
        onLogout: _logout,
      );
    }

    // Role missing or not supported in current mobile app
    return Scaffold(
      appBar: AppBar(
        title: const Text('MusclesMaster AI'),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                size: 56,
                color: _orange,
              ),
              const SizedBox(height: 16),
              const Text(
                'Dashboard not available',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                role == null || role.isEmpty
                    ? 'Your account role was not found. Please login again.'
                    : 'The "$role" role is not supported in this app yet.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _logout,
                child: const Text('Logout'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = _loggedInUser != null;

    // Dashboards have their own Scaffold.
    // Return them directly to avoid nested Scaffold layouts.
    if (!_isCheckingAuth &&
        _authCheckError == null &&
        isLoggedIn) {
      return _buildRoleDashboard();
    }

    return Scaffold(
      backgroundColor: _navy,
      body: Stack(
        children: [
          // GYM BACKGROUND IMAGE
          Positioned.fill(
            child: Image.asset(
              'assets/images/gym-background.jpg',
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
          ),

          // DARK OVERLAY
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xE607111D),
                    Color(0xCC07111D),
                    Color(0xF207111D),
                  ],
                ),
              ),
            ),
          ),

          // LOGIN CONTENT
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 24,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 440,
                  ),
                  child: _isCheckingAuth
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: _orange,
                          ),
                        )
                      : _authCheckError != null
                          ? _buildAuthError()
                          : _buildLoginForm(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // LOGIN FORM
  Widget _buildLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // BRAND LOGO
          Center(
            child: Container(
              height: 76,
              width: 76,
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: _navyBlue.withValues(alpha: 0.90),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: _orange.withValues(alpha: 0.75),
                ),
                boxShadow: [
                  BoxShadow(
                    color: _orange.withValues(alpha: 0.18),
                    blurRadius: 24,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.fitness_center,
                size: 42,
                color: _orange,
              ),
            ),
          ),

          // BRAND NAME
          RichText(
            textAlign: TextAlign.center,
            text: const TextSpan(
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.8,
                color: Colors.white,
              ),
              children: [
                TextSpan(text: 'MusclesMaster '),
                TextSpan(
                  text: 'AI',
                  style: TextStyle(
                    color: _orange,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          const Text(
            'GYM MANAGEMENT SYSTEM',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 3.2,
            ),
          ),

          const SizedBox(height: 28),

          // LOGIN CARD
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xF207111D),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: _orange.withValues(alpha: 0.85),
                width: 1.3,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.45),
                  blurRadius: 35,
                  offset: const Offset(0, 18),
                ),
                BoxShadow(
                  color: _orange.withValues(alpha: 0.08),
                  blurRadius: 24,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Welcome Back',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),

                const SizedBox(height: 10),

                const Text(
                  'Sign in to your account to continue',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFFADB8C5),
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 30),

                // EMAIL LABEL
                _loginLabel('Email Address'),

                const SizedBox(height: 9),

                // EMAIL FIELD
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                  ),
                  decoration: _loginInputDecoration(
                    hint: 'Enter your email',
                    icon: Icons.mail_outline_rounded,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your email';
                    }

                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 20),

                // PASSWORD LABEL
                _loginLabel('Password'),

                const SizedBox(height: 9),

                // PASSWORD FIELD
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _login(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                  ),
                  decoration: _loginInputDecoration(
                    hint: 'Enter your password',
                    icon: Icons.lock_outline_rounded,
                  ).copyWith(
                    suffixIcon: IconButton(
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.white70,
                      ),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 28),

                // LOGIN BUTTON
                SizedBox(
                  height: 56,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          _orange,
                          _lightOrange,
                          Color(0xFFD94308),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: _orange.withValues(alpha: 0.30),
                          blurRadius: 18,
                          offset: const Offset(0, 7),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        disabledBackgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Login',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ACCESS INFORMATION
                Row(
                  children: [
                    Expanded(
                      child: Divider(
                        color: Colors.white.withValues(alpha: 0.18),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 14,
                      ),
                      child: Text(
                        'ACCESS FOR',
                        style: TextStyle(
                          color: Color(0xFFADB8C5),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Divider(
                        color: Colors.white.withValues(alpha: 0.18),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // MEMBER AND TRAINER LABELS
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.people_alt_outlined,
                      color: Colors.white,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Members',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 18),
                    Container(
                      height: 26,
                      width: 1,
                      color: Colors.white24,
                    ),
                    const SizedBox(width: 18),
                    const Icon(
                      Icons.fitness_center,
                      color: _orange,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Trainers',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),

          const Text(
            'Secure access to your gym management platform.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white60,
              fontSize: 11,
            ),
          ),

          const SizedBox(height: 12),

          Text(
            '© ${DateTime.now().year} MusclesMaster AI',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white38,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  // LOGIN LABEL
  Widget _loginLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 13,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  // LOGIN INPUT DECORATION
  InputDecoration _loginInputDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: Color(0xFF8492A3),
        fontSize: 14,
      ),
      prefixIcon: Icon(
        icon,
        color: Colors.white70,
        size: 21,
      ),
      filled: true,
      fillColor: _navyBlue.withValues(alpha: 0.88),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 18,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: Color(0xFF536170),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: Color(0xFF536170),
          width: 1.1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: _orange,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: Colors.redAccent,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: Colors.redAccent,
          width: 1.5,
        ),
      ),
    );
  }

  // SESSION CHECK ERROR
  Widget _buildAuthError() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          Icons.wifi_off_rounded,
          size: 52,
          color: _orange,
        ),
        const SizedBox(height: 18),
        Text(
          _authCheckError!,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _checkExistingSession,
          style: ElevatedButton.styleFrom(
            backgroundColor: _orange,
            foregroundColor: Colors.white,
          ),
          child: const Text('Retry'),
        ),
      ],
    );
  }
}
