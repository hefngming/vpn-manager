import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../providers/app_providers.dart';
import 'login_screen.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  @override
  void initState() {
    super.initState();
    // 加载节点数据
    ref.read(nodesProvider.notifier).loadNodes();
  }

  String _getFlag(String? code) {
    final flags = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷',
      'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'DE': '🇩🇪',
      'UK': '🇬🇧', 'FR': '🇫🇷', 'AU': '🇦🇺', 'CA': '🇨🇦',
    };
    return flags[code?.toUpperCase()] ?? '🌐';
  }

  String _formatBytes(int bytes) {
    if (bytes == 0) return '0 B';
    final k = 1024;
    final sizes = ['B', 'KB', 'MB', 'GB'];
    final i = (bytes / k).floor();
    return '${(bytes / (k * i)).toStringAsFixed(2)} ${sizes[i.clamp(0, 3)]}';
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProvider);
    final nodesAsync = ref.watch(nodesProvider);
    final vpnState = ref.watch(vpnConnectionProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0f172a), Color(0xFF1e293b)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // 顶部状态栏
              _buildStatusBar(vpnState),
              
              // 连接区域
              _buildConnectionArea(vpnState),
              
              // 流量信息
              userAsync.when(
                data: (user) => user != null ? _buildTrafficInfo(user) : const SizedBox(),
                loading: () => const SizedBox(),
                error: (_, __) => const SizedBox(),
              ),
              
              // 节点列表
              Expanded(
                child: nodesAsync.when(
                  data: (nodes) => _buildNodesList(nodes, vpnState),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, _) => Center(
                    child: Text('加载失败: $error', style: const TextStyle(color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBar(VPNConnectionState vpnState) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 10.w,
                height: 10.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: vpnState.isConnected ? Colors.green : Colors.grey,
                ),
              ),
              SizedBox(width: 8.w),
              Text(
                vpnState.isConnected ? '已连接' : '未连接',
                style: TextStyle(
                  color: vpnState.isConnected ? Colors.green : Colors.white70,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (vpnState.isConnected)
            Text(
              _formatDuration(vpnState.connectionTime),
              style: const TextStyle(
                color: Colors.green,
                fontFamily: 'Courier',
                fontWeight: FontWeight.bold,
              ),
            ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white54),
            onPressed: () async {
              await ref.read(userProvider.notifier).logout();
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final h = duration.inHours.toString().padLeft(2, '0');
    final m = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final s = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  Widget _buildConnectionArea(VPNConnectionState vpnState) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 40.h),
      child: Column(
        children: [
          Text(
            vpnState.isConnected ? '⚡' : '🔒',
            style: const TextStyle(fontSize: 80),
          ),
          SizedBox(height: 16.h),
          Text(
            vpnState.isConnected ? '连接成功' : '未连接',
            style: TextStyle(
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          if (vpnState.isConnected && vpnState.connectedNodeId != null) ...[
            SizedBox(height: 8.h),
            Consumer(builder: (context, ref, child) {
              final nodesAsync = ref.watch(nodesProvider);
              return nodesAsync.when(
                data: (nodes) {
                  final node = nodes.firstWhere(
                    (n) => n.id == vpnState.connectedNodeId,
                    orElse: () => Node(id: '', displayName: '未知节点', tier: '', latency: 0, load: 0),
                  );
                  return Text(
                    '${_getFlag(node.countryCode)} ${node.displayName}',
                    style: TextStyle(
                      fontSize: 18.sp,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                },
                loading: () => const SizedBox(),
                error: (_, __) => const SizedBox(),
              );
            }),
            SizedBox(height: 24.h),
            ElevatedButton(
              onPressed: () => ref.read(vpnConnectionProvider.notifier).disconnect(),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 40.w, vertical: 16.h),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30.r),
                ),
              ),
              child: const Text('断开连接', style: TextStyle(fontSize: 16)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTrafficInfo(User user) {
    if (user.dailyLimit == null) return const SizedBox();
    
    final usage = user.dailyUsage;
    final limit = user.dailyLimit!;
    final percent = (usage / limit).clamp(0.0, 1.0);
    
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '今日流量',
                style: TextStyle(color: Colors.white70, fontSize: 14.sp),
              ),
              Text(
                '${_formatBytes(usage)} / ${_formatBytes(limit)}',
                style: TextStyle(color: Colors.white, fontSize: 14.sp),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(4.r),
            child: LinearProgressIndicator(
              value: percent,
              backgroundColor: Colors.white.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(
                percent > 0.8 ? Colors.red : const Color(0xFF667eea),
              ),
              minHeight: 6.h,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNodesList(List<Node> nodes, VPNConnectionState vpnState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
          child: Text(
            '选择节点',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            itemCount: nodes.length,
            itemBuilder: (context, index) {
              final node = nodes[index];
              final isSelected = vpnState.connectedNodeId == node.id;
              
              return Container(
                margin: EdgeInsets.only(bottom: 8.h),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12.r),
                  border: isSelected
                      ? Border.all(color: const Color(0xFF667eea), width: 2)
                      : null,
                ),
                child: ListTile(
                  onTap: vpnState.isConnected
                      ? null
                      : () => _showConnectDialog(node),
                  leading: Text(_getFlag(node.countryCode), style: const TextStyle(fontSize: 28)),
                  title: Text(
                    node.displayName,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    '${node.latency}ms · 负载 ${node.load}%',
                    style: TextStyle(
                      color: node.latency < 50
                          ? Colors.green
                          : node.latency < 100
                              ? Colors.orange
                              : Colors.red,
                      fontSize: 12.sp,
                    ),
                  ),
                  trailing: vpnState.isConnecting && isSelected
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : isSelected
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : const Icon(Icons.chevron_right, color: Colors.white38),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showConnectDialog(Node node) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1e293b),
        title: const Text('连接节点', style: TextStyle(color: Colors.white)),
        content: Text(
          '确定要连接到 ${_getFlag(node.countryCode)} ${node.displayName} 吗？',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(vpnConnectionProvider.notifier).connect(node.id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
            ),
            child: const Text('连接'),
          ),
        ],
      ),
    );
  }
}
