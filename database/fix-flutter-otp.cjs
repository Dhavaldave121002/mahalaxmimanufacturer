const fs = require('fs');
const path = require('path');

// 1. Update register_screen.dart to register directly and bypass OTP
const registerScreenPath = 'C:\\mahalaxmi_enterprises\\lib\\screens\\auth\\register\\register_screen.dart';
let registerCode = fs.readFileSync(registerScreenPath, 'utf8');

// Replace _handleRegister to call registerDirectly and go to home
const oldHandleRegister = `      // Stage user registration profile into local storage
      AppStorageService().stageRegistration(
        fullName: _fullNameController.text.trim(),
        companyName: _companyNameController.text.trim(),
        email: _emailController.text.trim(),
        mobile: _mobileController.text.trim(),
        password: _passwordController.text,
      );

      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() => _isLoading = false);
          Navigator.pushNamed(
            context,
            AppRoutes.otpVerification,
            arguments: {
              'contact': _mobileController.text.isNotEmpty
                  ? _mobileController.text.trim()
                  : _emailController.text.trim(),
              'isRegistration': true,
            },
          );
        }
      });`;

const newHandleRegister = `      // Directly register user account without OTP blocking
      AppStorageService().registerDirectly(
        fullName: _fullNameController.text.trim(),
        companyName: _companyNameController.text.trim(),
        email: _emailController.text.trim(),
        mobile: _mobileController.text.trim(),
        password: _passwordController.text,
      );

      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('Welcome, \${_fullNameController.text.trim()}! Account created.'),
                  ),
                ],
              ),
              backgroundColor: AppTheme.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
          Navigator.pushNamedAndRemoveUntil(
            context,
            AppRoutes.home,
            (route) => false,
          );
        }
      });`;

if (registerCode.includes(oldHandleRegister)) {
  registerCode = registerCode.replace(oldHandleRegister, newHandleRegister);
  fs.writeFileSync(registerScreenPath, registerCode, 'utf8');
  console.log('✅ register_screen.dart updated: OTP bypassed for direct registration!');
} else {
  console.log('⚠️ oldHandleRegister pattern not found in register_screen.dart');
}

// 2. Update otp_verification_screen.dart to prefill OTP and never launch external SMS
const otpScreenPath = 'C:\\mahalaxmi_enterprises\\lib\\screens\\auth\\otp_verification\\otp_verification_screen.dart';
let otpCode = fs.readFileSync(otpScreenPath, 'utf8');

// Replace initState to prefill OTP and NOT launch SMS url
const oldInitState = `  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final phone = _getContactText(context);
      _sendSmsToDevice(phone);
    });
  }`;

const newInitState = `  @override
  void initState() {
    super.initState();
    _startTimer();
    // Auto-fill test OTP (123456) so user never gets blocked
    final defaultCode = ['1', '2', '3', '4', '5', '6'];
    for (int i = 0; i < 6; i++) {
      _otpControllers[i].text = defaultCode[i];
    }
  }`;

if (otpCode.includes(oldInitState)) {
  otpCode = otpCode.replace(oldInitState, newInitState);
}

// In _handleVerify, accept any OTP or auto-verify
const oldVerifyCheck = `    final otp = _otpControllers.map((e) => e.text).join();
    if (otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter all 6 digits of the OTP code'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }`;

const newVerifyCheck = `    // Auto-verify code (123456) for instant registration and password reset
    final otp = _otpControllers.map((e) => e.text).join();
    if (otp.isEmpty) {
      for (int i = 0; i < 6; i++) {
        _otpControllers[i].text = '\${i + 1}';
      }
    }`;

if (otpCode.includes(oldVerifyCheck)) {
  otpCode = otpCode.replace(oldVerifyCheck, newVerifyCheck);
}

fs.writeFileSync(otpScreenPath, otpCode, 'utf8');
console.log('✅ otp_verification_screen.dart updated: External SMS launcher removed, OTP auto-verified!');
