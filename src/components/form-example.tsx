import {
  MoreVerticalIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  FileCodeIcon,
  MoreHorizontalIcon,
  FolderSearchIcon,
  SaveIcon,
  DownloadIcon,
  EyeIcon,
  LayoutIcon,
  PaletteIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  UserIcon,
  CreditCardIcon,
  SettingsIcon,
  KeyboardIcon,
  LanguagesIcon,
  BellIcon,
  MailIcon,
  ShieldIcon,
  HelpCircleIcon,
  FileTextIcon,
  LogOutIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { hexColorRegex, phoneRegex, usernameRegex } from '@/lib/regex'

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'] as const

const roleItems = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
  { label: 'Other', value: 'other' },
]

export function FormExample() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  })
  const [theme, setTheme] = useState('light')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [themeColor, setThemeColor] = useState('#6366f1')
  const [errors, setErrors] = useState({
    username: '',
    phone: '',
    themeColor: '',
  })

  const validateField = (field: string, value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
      return
    }

    switch (field) {
      case 'username':
        setErrors((prev) => ({
          ...prev,
          username: usernameRegex.test(value)
            ? ''
            : 'Username must be 3-20 characters (letters, numbers, underscores only)',
        }))
        break
      case 'phone':
        setErrors((prev) => ({
          ...prev,
          phone: phoneRegex.test(value) ? '' : 'Invalid phone number format',
        }))
        break
      case 'themeColor':
        setErrors((prev) => ({
          ...prev,
          themeColor: hexColorRegex.test(value) ? '' : 'Invalid hex color (e.g., #6366f1 or #63f)',
        }))
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>Please fill in your details below</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <MoreVerticalIcon />
              <span className="sr-only">More options</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>File</DropdownMenuLabel>
                <DropdownMenuItem>
                  <FileIcon />
                  New File
                  <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderIcon />
                  New Folder
                  <DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderOpenIcon />
                    Open Recent
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <FileCodeIcon />
                          Project Alpha
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileCodeIcon />
                          Project Beta
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <MoreHorizontalIcon />
                            More Projects
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem>
                                <FileCodeIcon />
                                Project Gamma
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileCodeIcon />
                                Project Delta
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <FolderSearchIcon />
                          Browse...
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <SaveIcon />
                  Save
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DownloadIcon />
                  Export
                  <DropdownMenuShortcut>⇧⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      email: checked,
                    })
                  }
                >
                  <EyeIcon />
                  Show Sidebar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={notifications.sms}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      sms: checked,
                    })
                  }
                >
                  <LayoutIcon />
                  Show Status Bar
                </DropdownMenuCheckboxItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <PaletteIcon />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                          <DropdownMenuRadioItem value="light">
                            <SunIcon />
                            Light
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="dark">
                            <MoonIcon />
                            Dark
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="system">
                            <MonitorIcon />
                            System
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <UserIcon />
                  Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCardIcon />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Preferences</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <KeyboardIcon />
                          Keyboard Shortcuts
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LanguagesIcon />
                          Language
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <BellIcon />
                            Notifications
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Notification Types</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                  checked={notifications.push}
                                  onCheckedChange={(checked) =>
                                    setNotifications({
                                      ...notifications,
                                      push: checked,
                                    })
                                  }
                                >
                                  <BellIcon />
                                  Push Notifications
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={notifications.email}
                                  onCheckedChange={(checked) =>
                                    setNotifications({
                                      ...notifications,
                                      email: checked,
                                    })
                                  }
                                >
                                  <MailIcon />
                                  Email Notifications
                                </DropdownMenuCheckboxItem>
                              </DropdownMenuGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <ShieldIcon />
                          Privacy & Security
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileTextIcon />
                  Documentation
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive">
                  <LogOutIcon />
                  Sign Out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="small-form-name">Name</FieldLabel>
                <Input id="small-form-name" placeholder="Enter your name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="small-form-role">Role</FieldLabel>
                <Select items={roleItems} defaultValue={null}>
                  <SelectTrigger id="small-form-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="small-form-username">Username</FieldLabel>
              <Input
                id="small-form-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  validateField('username', e.target.value)
                }}
                placeholder="john_doe123"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-destructive text-xs mt-1">{errors.username}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="small-form-phone">Phone Number</FieldLabel>
              <Input
                id="small-form-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  validateField('phone', e.target.value)
                }}
                placeholder="+1234567890"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="small-form-theme-color">Theme Color</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="small-form-theme-color"
                  value={themeColor}
                  onChange={(e) => {
                    setThemeColor(e.target.value)
                    validateField('themeColor', e.target.value)
                  }}
                  placeholder="#6366f1"
                  className={errors.themeColor ? 'border-destructive' : ''}
                />
                <div
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: themeColor }}
                />
              </div>
              {errors.themeColor && (
                <p className="text-destructive text-xs mt-1">{errors.themeColor}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="small-form-framework">Framework</FieldLabel>
              <Combobox items={frameworks}>
                <ComboboxInput
                  id="small-form-framework"
                  placeholder="Select a framework"
                  required
                />
                <ComboboxContent>
                  <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <FieldLabel htmlFor="small-form-comments">Comments</FieldLabel>
              <Textarea id="small-form-comments" placeholder="Add any additional comments" />
            </Field>
            <Field orientation="horizontal">
              <Button type="submit">Submit</Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
