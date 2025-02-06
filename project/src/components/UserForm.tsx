import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { Save, Edit, Upload, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserForm() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    country: '',
    religion: '',
    blood_group: '',
    marital_status: '',
    institution: '',
    hobbies: [],
    avatar_url: '',
  });
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
      setIsEditing(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        avatarUrl = await handleAvatarUpload(avatarFile);
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          ...profile, 
          id: user.id,
          avatar_url: avatarUrl,
        });

      if (upsertError) throw upsertError;

      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'hobbies') {
      setProfile((prev) => ({ 
        ...prev, 
        [name]: value.split(',').map(hobby => hobby.trim())
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Profile' : 'Your Profile'}
            </h2>
            <div className="flex gap-4">
              {!isEditing && (
                <>
                  <Link
                    to="/view-profile"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                  >
                    <Eye className="h-5 w-5 mr-1" />
                    View Profile
                  </Link>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                  >
                    <Edit className="h-5 w-5 mr-1" />
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  required
                  disabled={!isEditing}
                  value={profile.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  required
                  disabled={!isEditing}
                  value={profile.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                {isEditing && (
                  <div className="flex items-center">
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Photo
                      <input
                        id="avatar-upload"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                type="date"
                name="date_of_birth"
                id="date_of_birth"
                required
                disabled={!isEditing}
                value={profile.date_of_birth}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country of Origin *
              </label>
              <input
                type="text"
                name="country"
                id="country"
                required
                disabled={!isEditing}
                value={profile.country}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                Marital Status
              </label>
              <select
                name="marital_status"
                id="marital_status"
                disabled={!isEditing}
                value={profile.marital_status || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                Current Institution
              </label>
              <input
                type="text"
                name="institution"
                id="institution"
                disabled={!isEditing}
                value={profile.institution || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                placeholder="Enter your current institution"
              />
            </div>

            <div>
              <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                Religion
              </label>
              <input
                type="text"
                name="religion"
                id="religion"
                disabled={!isEditing}
                value={profile.religion || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700">
                Blood Group
              </label>
              <select
                name="blood_group"
                id="blood_group"
                disabled={!isEditing}
                value={profile.blood_group || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700">
                Hobbies
              </label>
              <textarea
                name="hobbies"
                id="hobbies"
                disabled={!isEditing}
                value={profile.hobbies?.join(', ') || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                placeholder="Enter your hobbies (comma-separated)"
                rows={3}
              />
            </div>

            {isEditing && (
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Profile
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}