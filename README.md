# BetterGroup ( BetterDiscord )

BetterDiscord용 **그룹 채팅 관리 플러그인**입니다.  
DM 그룹에서 멤버 초대, 추방, 그룹 이름 변경, 통화방 재접속 등을 편리하게 수행할 수 있습니다.

---

## 주요 기능

- **그룹 채널 ID 자동 감지**  
  현재 활성화된 그룹(DM)의 `channel-id`를 자동으로 입력해줍니다.

- **사용자 초대 & 추방**  
  - `user-id`를 입력 후 **초대** 버튼 → 해당 사용자를 그룹에 초대  
  - `user-id`를 입력 후 **추방** 버튼 → 해당 사용자를 그룹에서 제거

- **통화방 모두 재접속**  
  - 통화방의 지역(region)을 임의 변경하여, 참여 중인 모든 사용자를 강제로 재접속시킵니다.
  - 연결 문제 해결 및 음성 싱크 문제 해결에 유용합니다.

- **그룹 이름 변경**  
  - `그룹 이름 변경` 토글을 켜면, 메시지를 전송할 때마다 그룹 이름을 자동으로 변경합니다.

## 설치 방법

1. [BetterDiscord](https://betterdiscord.app/) 설치
2. 플러그인 파일(`GroupManager.plugin.js`) 다운로드
3. BetterDiscord 플러그인 폴더에 파일 복사
   - Windows: `%AppData%\BetterDiscord\plugins`
   - macOS: `~/Library/Application Support/BetterDiscord/plugins`
4. Discord → 사용자 설정 → **Plugins** → 플러그인 활성화

---

## 사용 방법

1. 그룹(DM) 채팅방 열기  
2. 플러그인 패널에서 **channel-id**가 자동 입력되었는지 확인  
3. 필요 시 **user-id** 입력  
4. 원하는 기능 버튼 클릭:
   - **초대** → 새 멤버 추가
   - **추방** → 멤버 제거
   - **모두 재접속** → 통화방 리프레시
   - **그룹 이름 변경** → 토글 켜고 메시지 전송 시 이름 자동 변경

---

## 주의 사항

- **이 플러그인은 DM 그룹에서만 동작**합니다. (서버 지원 X)
- Discord API를 직접 호출하므로, 무분별한 사용은 계정 제재로 이어질 수 있습니다.
- 본 플러그인은 교육 및 개인적 실험 목적으로 제공됩니다.

---

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.
